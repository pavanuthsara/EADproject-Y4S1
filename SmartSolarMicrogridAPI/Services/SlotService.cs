/*
 * File: SlotService.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: Business rules for booking slots inside a station: creating, editing and
 *              deleting them, opening and closing them, and what each role may see.
 *
 * Individual Contribution: Implemented slot management, keeping every slot inside its
 *                          station's battery limits and safe against simultaneous bookings.
 */

using Microsoft.Extensions.Options;
using SmartSolarMicrogridAPI.Common.Constants;
using SmartSolarMicrogridAPI.Common.Enums;
using SmartSolarMicrogridAPI.Common.Exceptions;
using SmartSolarMicrogridAPI.Configuration;
using SmartSolarMicrogridAPI.DTOs.Requests;
using SmartSolarMicrogridAPI.DTOs.Responses;
using SmartSolarMicrogridAPI.Models.Entities;
using SmartSolarMicrogridAPI.Repositories.Interfaces;
using SmartSolarMicrogridAPI.Services.Interfaces;

namespace SmartSolarMicrogridAPI.Services;

public class SlotService(
    ISolarStationRepository stationRepository,
    IEnergyBookingSlotRepository slotRepository,
    IEnergyReservationRepository reservationRepository,
    IOptions<ReservationPolicyOptions> policyOptions,
    TimeProvider timeProvider) : ISlotService
{
    private readonly ReservationPolicyOptions _policy = policyOptions.Value;

    private DateTime UtcNow => timeProvider.GetUtcNow().UtcDateTime;

    // Creates an empty Available slot after checking it fits inside the station's battery limits.
    public async Task<ScheduleResponseDto> CreateSlotAsync(string stationId, SlotRequestDto dto)
    {
        var station = await GetActiveStationAsync(stationId);
        var details = ReadDetails(dto);

        EnsureWindowIsValid(details.Start, details.End, requireFutureStart: true);
        EnsureWithinStationLimits(station, details.TotalPositions, details.CapacityKwh);

        if (await slotRepository.HasOverlapAsync(station.Id, details.Start, details.End, excludeSlotId: null))
        {
            throw new BusinessRuleException(SlotMessages.Overlap);
        }

        DateTime now = UtcNow;
        var slot = new EnergyBookingSlot
        {
            StationId = station.Id,
            StartTime = details.Start,
            EndTime = details.End,
            TotalPositions = details.TotalPositions,
            ReservedPositions = 0,
            CapacityKwh = details.CapacityKwh,
            ReservedKwh = 0,
            SupportedDirections = details.Directions.Select(d => d.ToString()).ToList(),
            Status = SlotStatus.Available.ToString(),
            CreatedAt = now,
            UpdatedAt = now
        };

        var created = await slotRepository.CreateAsync(slot);
        return MapSlot(created);
    }

    // Replaces a slot's details. The database only accepts the change while it still covers what is booked.
    public async Task<ScheduleResponseDto> UpdateSlotAsync(string stationId, string slotId, SlotRequestDto dto)
    {
        var station = await GetActiveStationAsync(stationId);
        var slot = await GetSlotAtStationAsync(slotId, station.Id);
        var details = ReadDetails(dto);

        EnsureWithinStationLimits(station, details.TotalPositions, details.CapacityKwh);

        bool timeWindowChanging = TruncateToMilliseconds(details.Start) != TruncateToMilliseconds(ToUtc(slot.StartTime))
            || TruncateToMilliseconds(details.End) != TruncateToMilliseconds(ToUtc(slot.EndTime));

        if (timeWindowChanging)
        {
            EnsureWindowIsValid(details.Start, details.End, requireFutureStart: true);

            if (slot.ReservedPositions > 0)
            {
                throw new BusinessRuleException(SlotMessages.TimeChangeWithBookings);
            }

            if (await slotRepository.HasOverlapAsync(station.Id, details.Start, details.End, slot.Id))
            {
                throw new BusinessRuleException(SlotMessages.Overlap);
            }
        }

        if (details.TotalPositions < slot.ReservedPositions)
        {
            throw new BusinessRuleException(SlotMessages.PositionsBelowBooked(slot.ReservedPositions));
        }

        if (details.CapacityKwh < slot.ReservedKwh)
        {
            throw new BusinessRuleException(SlotMessages.CapacityBelowBooked(slot.ReservedKwh));
        }

        await EnsureNoUsedDirectionIsRemovedAsync(slot.Id, details.Directions);

        // The same limits are checked again inside one database update, because a booking may arrive after the checks above.
        var updated = await slotRepository.TryUpdateDetailsAsync(
            slot.Id, details.Start, details.End, details.TotalPositions, details.CapacityKwh,
            details.Directions.Select(d => d.ToString()).ToList(), timeWindowChanging);

        if (updated == null)
        {
            throw new ConflictException(SlotMessages.ConcurrentChange);
        }

        return MapSlot(updated);
    }

    // Deletes a slot that nobody has booked; the database refuses if a booking arrives at the same moment.
    public async Task DeleteSlotAsync(string stationId, string slotId)
    {
        var station = await stationRepository.GetByIdAsync(stationId)
            ?? throw new NotFoundException($"Station {stationId} not found.");
        var slot = await GetSlotAtStationAsync(slotId, station.Id);

        var active = await reservationRepository.GetActiveBySlotAsync(slot.Id);
        if (active.Count > 0)
        {
            throw new BusinessRuleException(SlotMessages.HasActiveReservations(active.Count));
        }

        if (!await slotRepository.TryDeleteUnreservedAsync(slot.Id))
        {
            // Either someone else already deleted it, or a position was reserved after the check above.
            var stillThere = await slotRepository.GetByIdAsync(slot.Id);
            if (stillThere != null)
            {
                throw new ConflictException(SlotMessages.BookedWhileDeleting);
            }
        }
    }

    // Closes a slot to new bookings, or reopens it as Available or Full depending on how much is booked.
    public async Task<ScheduleResponseDto> SetAvailabilityAsync(string stationId, string slotId, bool open)
    {
        var station = await GetActiveStationAsync(stationId);
        var slot = await GetSlotAtStationAsync(slotId, station.Id);

        var updated = await slotRepository.TrySetOpenAsync(slot.Id, open)
            ?? throw new NotFoundException(SlotMessages.SlotNotFound(slotId, stationId));

        return MapSlot(updated);
    }

    // Lists a station's slots, earliest first. A prosumer only sees slots they could still book.
    public async Task<IEnumerable<ScheduleResponseDto>> GetSlotsAsync(string stationId, bool isStaff)
    {
        var station = isStaff
            ? await stationRepository.GetByIdAsync(stationId)
            : await GetActiveStationAsync(stationId);

        if (station == null)
        {
            throw new NotFoundException($"Station {stationId} not found.");
        }

        var slots = await slotRepository.FindByStationAsync(station.Id);

        if (isStaff)
        {
            return slots.Select(MapSlot).ToList();
        }

        DateTime now = UtcNow;
        DateTime latestStart = now.AddDays(_policy.BookingWindowDays);
        string closed = SlotStatus.Closed.ToString();

        // Full slots stay in the list so the app can show them greyed out; closed, started and too-far-ahead slots are hidden.
        return slots
            .Where(s => s.Status != closed && ToUtc(s.StartTime) > now && ToUtc(s.StartTime) <= latestStart)
            .Select(MapSlot)
            .ToList();
    }

    // Loads a station and requires it to be active; a deactivated station is treated as not found.
    private async Task<SolarStation> GetActiveStationAsync(string stationId)
    {
        var station = await stationRepository.GetByIdAsync(stationId);
        if (station == null || station.Status != StationStatus.Active.ToString())
        {
            throw new NotFoundException(SlotMessages.StationNotFound(stationId));
        }

        return station;
    }

    // Loads a slot and verifies it belongs to the station, so ids from different stations cannot be mixed.
    private async Task<EnergyBookingSlot> GetSlotAtStationAsync(string slotId, string stationId)
    {
        var slot = await slotRepository.GetByIdAsync(slotId);
        if (slot == null || slot.StationId != stationId)
        {
            throw new NotFoundException(SlotMessages.SlotNotFound(slotId, stationId));
        }

        return slot;
    }

    // Converts the request into UTC times and a clean, duplicate-free direction list.
    private static (DateTime Start, DateTime End, int TotalPositions, double CapacityKwh, IReadOnlyList<EnergyDirection> Directions)
        ReadDetails(SlotRequestDto dto)
    {
        var directions = dto.SupportedDirections!.Distinct().ToList();
        if (directions.Count == 0)
        {
            throw new BusinessRuleException(SlotMessages.NoDirections);
        }

        return (ToUtc(dto.StartTime!.Value), ToUtc(dto.EndTime!.Value), dto.TotalPositions, dto.CapacityKwh, directions);
    }

    // Requires the end after the start, and optionally a start in the future.
    private void EnsureWindowIsValid(DateTime start, DateTime end, bool requireFutureStart)
    {
        if (end <= start)
        {
            throw new BusinessRuleException(SlotMessages.EndBeforeStart);
        }

        if (requireFutureStart && start <= UtcNow)
        {
            throw new BusinessRuleException(SlotMessages.StartInPast);
        }
    }

    // A slot cannot promise more positions or energy than the station's battery has.
    private static void EnsureWithinStationLimits(SolarStation station, int totalPositions, double capacityKwh)
    {
        if (totalPositions > station.TotalBays)
        {
            throw new BusinessRuleException(SlotMessages.TooManyPositions(station.TotalBays));
        }

        if (capacityKwh > station.CapacityKwh)
        {
            throw new BusinessRuleException(SlotMessages.TooMuchCapacity(station.CapacityKwh));
        }
    }

    // A direction cannot be taken away from a slot while an active booking is using it.
    private async Task EnsureNoUsedDirectionIsRemovedAsync(string slotId, IReadOnlyList<EnergyDirection> newDirections)
    {
        var active = await reservationRepository.GetActiveBySlotAsync(slotId);

        foreach (var direction in active.Select(r => r.DirectionValue).Distinct())
        {
            if (!newDirections.Contains(direction))
            {
                throw new BusinessRuleException(SlotMessages.DirectionInUse(direction.ToString()));
            }
        }
    }

    private static DateTime ToUtc(DateTime value) =>
        value.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(value, DateTimeKind.Utc)
            : value.ToUniversalTime();

    // MongoDB keeps milliseconds only, so times are compared at that precision.
    private static DateTime TruncateToMilliseconds(DateTime value) =>
        new(value.Ticks - value.Ticks % TimeSpan.TicksPerMillisecond, DateTimeKind.Utc);

    private static ScheduleResponseDto MapSlot(EnergyBookingSlot slot) => new()
    {
        Id = slot.Id,
        StationId = slot.StationId,
        StartTime = slot.StartTime,
        EndTime = slot.EndTime,
        TotalPositions = slot.TotalPositions,
        ReservedPositions = slot.ReservedPositions,
        CapacityKwh = slot.CapacityKwh,
        ReservedKwh = slot.ReservedKwh,
        SupportedDirections = slot.SupportedDirections,
        Status = slot.Status,
        UpdatedAt = slot.UpdatedAt
    };
}
