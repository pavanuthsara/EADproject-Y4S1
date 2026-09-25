/*
 * File: StationService.cs
 * Author: Ransilu Samaraweera
 * Group: 45
 * Description: Implementation of solar station management business logic.
 * Individual Contribution: Implemented station registration, schedule updates and
 *                          deactivation guarded by active energy reservations.
 */

using MongoDB.Driver;
using MongoDB.Driver.GeoJsonObjectModel;
using SmartSolarMicrogridAPI.Common.Enums;
using SmartSolarMicrogridAPI.Common.Exceptions;
using SmartSolarMicrogridAPI.DTOs.Requests;
using SmartSolarMicrogridAPI.DTOs.Responses;
using SmartSolarMicrogridAPI.Models.Entities;
using SmartSolarMicrogridAPI.Repositories.Interfaces;
using SmartSolarMicrogridAPI.Services.Interfaces;

namespace SmartSolarMicrogridAPI.Services;

public class StationService(
    IMongoRepository<SolarStation> stationRepository,
    IMongoRepository<EnergyBookingSlot> slotRepository,
    IMongoRepository<EnergyReservation> reservationRepository) : IStationService
{
    // Registers a new station as Active with its GPS location, capacity and battery storage slots.
    public async Task<StationResponseDto> CreateStationAsync(CreateStationRequestDto dto, string createdByUserId)
    {
        string stationCode = dto.StationCode.Trim().ToUpperInvariant();

        bool codeExists = await stationRepository.ExistsAsync(s => s.StationCode == stationCode);
        if (codeExists)
            throw new BusinessRuleException("A station with this code already exists.");

        var station = new SolarStation
        {
            StationName = dto.StationName.Trim(),
            StationCode = stationCode,
            // GeoJSON expects longitude first, then latitude.
            Location = new GeoJsonPoint<GeoJson2DGeographicCoordinates>(
                new GeoJson2DGeographicCoordinates(dto.Longitude!.Value, dto.Latitude!.Value)),
            AddressLine = dto.AddressLine.Trim(),
            City = dto.City.Trim(),
            CapacityKwh = dto.CapacityKwh,
            TotalBays = dto.TotalBays,
            Status = StationStatus.Active.ToString(),
            CreatedBy = createdByUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        try
        {
            var created = await stationRepository.CreateAsync(station);
            return MapStation(created);
        }
        catch (MongoWriteException ex) when (ex.WriteError.Category == ServerErrorCategory.DuplicateKey)
        {
            // Two requests with the same code raced past the check above; the unique index caught it.
            throw new BusinessRuleException("A station with this code already exists.");
        }
    }

    // Replaces a booking slot's schedule while keeping existing reservations valid.
    public async Task<ScheduleResponseDto> UpdateScheduleAsync(string stationId, string slotId, UpdateScheduleRequestDto dto)
    {
        var station = await stationRepository.GetByIdAsync(stationId);
        if (station == null)
            throw new NotFoundException($"Station {stationId} not found.");

        if (station.Status != StationStatus.Active.ToString())
            throw new BusinessRuleException("Schedules cannot be changed for an inactive station.");

        var slot = await slotRepository.GetByIdAsync(slotId);
        if (slot == null || slot.StationId != stationId)
            throw new NotFoundException($"Schedule {slotId} not found for station {stationId}.");

        if (dto.Status == SlotStatus.Full)
            throw new BusinessRuleException("A schedule cannot be set to Full manually; it becomes Full when every position is reserved.");

        DateTime start = ToUtc(dto.StartTime!.Value);
        DateTime end = ToUtc(dto.EndTime!.Value);

        if (end <= start)
            throw new BusinessRuleException("The end time must be after the start time.");

        if (dto.TotalPositions > station.TotalBays)
            throw new BusinessRuleException($"Total positions cannot exceed the station's {station.TotalBays} battery storage slots.");

        var activeReservations = await GetActiveReservationsForSlotAsync(slotId);

        if (dto.TotalPositions < activeReservations.Count)
            throw new BusinessRuleException($"Total positions cannot be lower than the {activeReservations.Count} active reservation(s) already booked on this schedule.");

        bool timeWindowChanged = start != ToUtc(slot.StartTime) || end != ToUtc(slot.EndTime);
        if (timeWindowChanged)
        {
            if (activeReservations.Count > 0)
                throw new BusinessRuleException("The time window cannot be changed while the schedule has active reservations.");

            if (start <= DateTime.UtcNow)
                throw new BusinessRuleException("The start time must be in the future.");

            bool overlaps = await slotRepository.ExistsAsync(s =>
                s.StationId == stationId && s.Id != slotId && s.StartTime < end && s.EndTime > start);
            if (overlaps)
                throw new BusinessRuleException("This time window overlaps another schedule at the same station.");
        }

        // Each active reservation occupies one position.
        SlotStatus newStatus = dto.Status == SlotStatus.Closed
            ? SlotStatus.Closed
            : activeReservations.Count >= dto.TotalPositions ? SlotStatus.Full : SlotStatus.Available;

        slot.StartTime = start;
        slot.EndTime = end;
        slot.TotalPositions = dto.TotalPositions;
        slot.Status = newStatus.ToString();
        slot.UpdatedAt = DateTime.UtcNow;

        await slotRepository.UpdateAsync(slot.Id, slot);

        return new ScheduleResponseDto
        {
            Id = slot.Id,
            StationId = slot.StationId,
            StartTime = slot.StartTime,
            EndTime = slot.EndTime,
            TotalPositions = slot.TotalPositions,
            Status = slot.Status,
            UpdatedAt = slot.UpdatedAt
        };
    }

    // Deactivates a station, refusing while any Pending or Approved reservation is tied to it.
    public async Task<StationResponseDto> DeactivateStationAsync(string stationId, string deactivatedByUserId)
    {
        var station = await stationRepository.GetByIdAsync(stationId);
        if (station == null)
            throw new NotFoundException($"Station {stationId} not found.");

        if (station.Status == StationStatus.Inactive.ToString())
            throw new BusinessRuleException("This station is already deactivated.");

        // Check-then-update: a reservation created between this check and the update is not caught.
        var activeReservations = await GetActiveReservationsForStationAsync(stationId);
        if (activeReservations.Count > 0)
            throw new BusinessRuleException(
                $"This station cannot be deactivated because it has {activeReservations.Count} active energy reservation(s). " +
                "Complete, cancel or reject them first.");

        station.Status = StationStatus.Inactive.ToString();
        station.DeactivatedBy = deactivatedByUserId;
        station.DeactivatedAt = DateTime.UtcNow;
        station.UpdatedAt = DateTime.UtcNow;

        await stationRepository.UpdateAsync(station.Id, station);

        return MapStation(station);
    }

    // Active reservations are Pending or Approved; Rejected, Completed and Cancelled are finished.
    // Statuses are stored as strings, so they are resolved to locals before being used in a query.
    private Task<IReadOnlyList<EnergyReservation>> GetActiveReservationsForStationAsync(string stationId)
    {
        string pending = ReservationStatus.Pending.ToString();
        string approved = ReservationStatus.Approved.ToString();

        return reservationRepository.FindAsync(r =>
            r.StationId == stationId && (r.Status == pending || r.Status == approved));
    }

    private Task<IReadOnlyList<EnergyReservation>> GetActiveReservationsForSlotAsync(string slotId)
    {
        string pending = ReservationStatus.Pending.ToString();
        string approved = ReservationStatus.Approved.ToString();

        return reservationRepository.FindAsync(r =>
            r.SlotId == slotId && (r.Status == pending || r.Status == approved));
    }

    // Treats an unspecified kind as UTC, matching DateTimeHelper.
    private static DateTime ToUtc(DateTime value) =>
        value.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(value, DateTimeKind.Utc)
            : value.ToUniversalTime();

    private static StationResponseDto MapStation(SolarStation station) => new()
    {
        Id = station.Id,
        StationName = station.StationName,
        StationCode = station.StationCode,
        Latitude = station.Location.Coordinates.Latitude,
        Longitude = station.Location.Coordinates.Longitude,
        AddressLine = station.AddressLine,
        City = station.City,
        CapacityKwh = station.CapacityKwh,
        TotalBays = station.TotalBays,
        Status = station.Status,
        CreatedAt = station.CreatedAt,
        DeactivatedAt = station.DeactivatedAt
    };
}
