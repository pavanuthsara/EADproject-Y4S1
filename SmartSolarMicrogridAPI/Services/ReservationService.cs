/*
 * File: ReservationService.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: Business rules and orchestration for energy reservations: the booking
 *              window, notice period, direction, duplicate and slot capacity rules, and
 *              the reserved counters that must always match the live bookings.
 *
 * Individual Contribution: Implemented the create, update and cancel reservation logic,
 *                          every business rule, and the capacity bookkeeping.
 */

using System.Security.Cryptography;
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

public class ReservationService(
    ISolarStationRepository stationRepository,
    IEnergyBookingSlotRepository slotRepository,
    IEnergyReservationRepository reservationRepository,
    IOptions<ReservationPolicyOptions> policyOptions,
    TimeProvider timeProvider) : IReservationService
{
    private const int PositionsPerReservation = 1;
    private const int ReservationNoRandomLength = 8;
    private const int QrTokenLength = 64;

    private static readonly ReservationStatus[] ActiveStatuses = [ReservationStatus.Pending, ReservationStatus.Approved];

    private readonly ReservationPolicyOptions _policy = policyOptions.Value;

    private DateTime UtcNow => timeProvider.GetUtcNow().UtcDateTime;

    // Creates a Pending reservation once every rule passes, reserving the slot's capacity before inserting it.
    public async Task<ReservationSummaryResponse> CreateAsync(
        CreateReservationRequest request, string prosumerId, string prosumerNic)
    {
        EnergyDirection direction = request.Direction!.Value;
        double requestedKwh = request.RequestedKwh!.Value;

        var station = await GetActiveStationAsync(request.StationId);
        var slot = await GetSlotAtStationAsync(request.SlotId, station.Id);

        EnsureSlotIsBookable(slot, direction);
        await EnsureNoDuplicateBookingAsync(prosumerId, slot.Id, excludeReservationId: null);
        EnsureFreePosition(slot);
        EnsureKwhHeadroom(slot, requestedKwh);

        await ReserveCapacityAsync(slot.Id, PositionsPerReservation, requestedKwh);

        DateTime now = UtcNow;
        var reservation = new EnergyReservation
        {
            ReservationNo = GenerateReservationNo(now),
            ProsumerId = prosumerId,
            ProsumerNic = prosumerNic,
            SlotId = slot.Id,
            StationId = station.Id,
            SlotStartUtc = ToUtc(slot.StartTime),
            SlotEndUtc = ToUtc(slot.EndTime),
            DirectionValue = direction,
            RequestedKwh = requestedKwh,
            StatusValue = ReservationStatus.Pending,
            QrToken = RandomNumberGenerator.GetHexString(QrTokenLength),
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };

        try
        {
            await reservationRepository.CreateAsync(reservation);
        }
        catch
        {
            await ReleaseCapacityAsync(slot.Id, PositionsPerReservation, requestedKwh);
            throw;
        }

        return BuildSummary(reservation, station.StationName, ReservationMessages.Created);
    }

    // Changes the slot, direction or kWh of a reservation, moving capacity between slots and voiding any approval.
    public async Task<ReservationSummaryResponse> UpdateAsync(
        string reservationId, UpdateReservationRequest request, string prosumerId)
    {
        if (request.SlotId == null && request.Direction == null && request.RequestedKwh == null)
        {
            throw new BusinessRuleException(ReservationMessages.NothingToUpdate);
        }

        var reservation = await GetOwnedReservationAsync(reservationId, prosumerId);
        EnsureCanBeChanged(reservation);

        string targetSlotId = request.SlotId ?? reservation.SlotId;
        EnergyDirection targetDirection = request.Direction ?? reservation.DirectionValue;
        double targetKwh = request.RequestedKwh ?? reservation.RequestedKwh;

        bool slotChanging = targetSlotId != reservation.SlotId;
        bool directionChanging = targetDirection != reservation.DirectionValue;
        bool kwhChanging = targetKwh != reservation.RequestedKwh;

        if (!slotChanging && !directionChanging && !kwhChanging)
        {
            string unchangedStationName = await GetStationNameAsync(reservation.StationId);
            return BuildSummary(reservation, unchangedStationName, ReservationMessages.NoChanges);
        }

        bool wasApproved = reservation.StatusValue == ReservationStatus.Approved;

        string stationName = slotChanging
            ? await MoveToSlotAsync(reservation, targetSlotId, targetDirection, targetKwh, prosumerId)
            : await ChangeTermsOnSameSlotAsync(reservation, targetDirection, targetKwh, directionChanging);

        string message = wasApproved ? ReservationMessages.UpdatedApprovalReset : ReservationMessages.Updated;
        return BuildSummary(reservation, stationName, message);
    }

    // Soft-cancels a reservation and releases its capacity; the document is kept as a ledger record.
    public async Task<ReservationSummaryResponse> CancelAsync(string reservationId, string prosumerId)
    {
        var reservation = await GetOwnedReservationAsync(reservationId, prosumerId);
        EnsureCanBeChanged(reservation);

        DateTime now = UtcNow;
        reservation.StatusValue = ReservationStatus.Cancelled;
        reservation.CancelledBy = prosumerId;
        reservation.CancelledAtUtc = now;
        reservation.UpdatedAtUtc = now;

        await SaveOrRollbackAsync(reservation, rollback: null);
        await ReleaseCapacityAsync(reservation.SlotId, PositionsPerReservation, reservation.RequestedKwh);

        string stationName = await GetStationNameAsync(reservation.StationId);
        return BuildSummary(reservation, stationName, ReservationMessages.Cancelled);
    }

    // Approves a Pending reservation whose slot has not started yet; the 12-hour notice rule does not apply to staff.
    public async Task<ReservationSummaryResponse> ApproveAsync(string reservationId, string staffUserId)
    {
        var reservation = await GetReservationAsync(reservationId);

        if (reservation.StatusValue != ReservationStatus.Pending)
        {
            throw new ConflictException(ReservationMessages.CannotApprove(reservation.Status));
        }

        if (!IsInFuture(reservation.SlotStartUtc))
        {
            throw new BusinessRuleException(ReservationMessages.ApproveSlotStarted);
        }

        DateTime now = UtcNow;
        reservation.StatusValue = ReservationStatus.Approved;
        reservation.ApprovedBy = staffUserId;
        reservation.ApprovedAtUtc = now;
        reservation.UpdatedAtUtc = now;

        await SaveOrRollbackAsync(reservation, rollback: null);

        string stationName = await GetStationNameAsync(reservation.StationId);
        return BuildSummary(reservation, stationName, ReservationMessages.Approved);
    }

    // Rejects a Pending or Approved reservation, then gives its position and kWh back to the slot.
    // Saving the new status comes first, so capacity is only released for a rejection that was really saved.
    public async Task<ReservationSummaryResponse> RejectAsync(string reservationId, string staffUserId, string reason)
    {
        var reservation = await GetReservationAsync(reservationId);

        if (!IsModifiableState(reservation.StatusValue))
        {
            throw new ConflictException(ReservationMessages.CannotReject(reservation.Status));
        }

        DateTime now = UtcNow;
        reservation.StatusValue = ReservationStatus.Rejected;
        reservation.RejectedBy = staffUserId;
        reservation.RejectedAtUtc = now;
        reservation.RejectionReason = reason.Trim();
        reservation.ApprovedBy = null;
        reservation.ApprovedAtUtc = null;
        reservation.UpdatedAtUtc = now;

        await SaveOrRollbackAsync(reservation, rollback: null);
        await ReleaseCapacityAsync(reservation.SlotId, PositionsPerReservation, reservation.RequestedKwh);

        string stationName = await GetStationNameAsync(reservation.StationId);
        return BuildSummary(reservation, stationName, ReservationMessages.Rejected);
    }

    // Moves a reservation to a different slot: re-runs every create rule, reserves on the new slot, then releases the old one.
    private async Task<string> MoveToSlotAsync(
        EnergyReservation reservation, string newSlotId, EnergyDirection direction, double kwh, string prosumerId)
    {
        var newSlot = await GetSlotAsync(newSlotId);
        var newStation = await GetActiveStationAsync(newSlot.StationId);

        EnsureSlotIsBookable(newSlot, direction);
        await EnsureNoDuplicateBookingAsync(prosumerId, newSlot.Id, reservation.Id);
        EnsureFreePosition(newSlot);
        EnsureKwhHeadroom(newSlot, kwh);

        string oldSlotId = reservation.SlotId;
        double oldKwh = reservation.RequestedKwh;

        await ReserveCapacityAsync(newSlot.Id, PositionsPerReservation, kwh);

        reservation.SlotId = newSlot.Id;
        reservation.StationId = newStation.Id;
        reservation.SlotStartUtc = ToUtc(newSlot.StartTime);
        reservation.SlotEndUtc = ToUtc(newSlot.EndTime);
        ApplyNewTerms(reservation, direction, kwh);

        await SaveOrRollbackAsync(reservation, () => ReleaseCapacityAsync(newSlot.Id, PositionsPerReservation, kwh));
        await ReleaseCapacityAsync(oldSlotId, PositionsPerReservation, oldKwh);

        return newStation.StationName;
    }

    // Changes direction or kWh on the same slot, moving the kWh counter by the difference only.
    private async Task<string> ChangeTermsOnSameSlotAsync(
        EnergyReservation reservation, EnergyDirection direction, double kwh, bool directionChanging)
    {
        var slot = await GetSlotAsync(reservation.SlotId);

        if (directionChanging)
        {
            EnsureDirectionSupported(slot, direction);
        }

        // The reservation's own kWh is already counted in the slot, so only the difference needs headroom.
        double kwhDelta = kwh - reservation.RequestedKwh;
        if (kwhDelta > 0)
        {
            EnsureKwhHeadroom(slot, kwhDelta);
            await ReserveCapacityAsync(slot.Id, 0, kwhDelta);
        }

        ApplyNewTerms(reservation, direction, kwh);

        Func<Task>? rollback = kwhDelta > 0 ? () => ReleaseCapacityAsync(slot.Id, 0, kwhDelta) : null;
        await SaveOrRollbackAsync(reservation, rollback);

        if (kwhDelta < 0)
        {
            await ReleaseCapacityAsync(slot.Id, 0, -kwhDelta);
        }

        return await GetStationNameAsync(reservation.StationId);
    }

    // Applies changed terms; any material change returns the reservation to Pending and voids the approval.
    private void ApplyNewTerms(EnergyReservation reservation, EnergyDirection direction, double kwh)
    {
        reservation.DirectionValue = direction;
        reservation.RequestedKwh = kwh;
        reservation.StatusValue = ReservationStatus.Pending;
        reservation.ApprovedBy = null;
        reservation.ApprovedAtUtc = null;
        reservation.UpdatedAtUtc = UtcNow;
    }

    // Loads a station and requires it to be active; a deactivated station is treated as not found.
    private async Task<SolarStation> GetActiveStationAsync(string stationId)
    {
        var station = await stationRepository.GetByIdAsync(stationId);
        if (station == null || station.Status != StationStatus.Active.ToString())
        {
            throw new NotFoundException(ReservationMessages.StationNotFound(stationId));
        }

        return station;
    }

    // Loads a slot and verifies it belongs to the given station, so ids from different stations cannot be mixed.
    private async Task<EnergyBookingSlot> GetSlotAtStationAsync(string slotId, string stationId)
    {
        var slot = await slotRepository.GetByIdAsync(slotId);
        if (slot == null || slot.StationId != stationId)
        {
            throw new NotFoundException(ReservationMessages.SlotNotAtStation(slotId, stationId));
        }

        return slot;
    }

    // Loads a slot by id.
    private async Task<EnergyBookingSlot> GetSlotAsync(string slotId)
    {
        var slot = await slotRepository.GetByIdAsync(slotId);
        if (slot == null)
        {
            throw new NotFoundException(ReservationMessages.SlotNotFound(slotId));
        }

        return slot;
    }

    // Loads a reservation by id, whoever owns it; used by staff decisions.
    private async Task<EnergyReservation> GetReservationAsync(string reservationId)
    {
        var reservation = await reservationRepository.GetByIdAsync(reservationId);
        if (reservation == null)
        {
            throw new NotFoundException(ReservationMessages.ReservationNotFound(reservationId));
        }

        return reservation;
    }

    // Loads a reservation and requires it to belong to the calling prosumer.
    private async Task<EnergyReservation> GetOwnedReservationAsync(string reservationId, string prosumerId)
    {
        var reservation = await reservationRepository.GetByIdAsync(reservationId);
        if (reservation == null)
        {
            throw new NotFoundException(ReservationMessages.ReservationNotFound(reservationId));
        }

        if (reservation.ProsumerId != prosumerId)
        {
            throw new ForbiddenException(ReservationMessages.NotOwner);
        }

        return reservation;
    }

    // Returns the station's name for the summary, or an empty string if it no longer exists.
    private async Task<string> GetStationNameAsync(string stationId)
    {
        var station = await stationRepository.GetByIdAsync(stationId);
        return station?.StationName ?? string.Empty;
    }

    // Checks the slot is open, starts in the future, is inside the booking window and supports the direction.
    private void EnsureSlotIsBookable(EnergyBookingSlot slot, EnergyDirection direction)
    {
        if (slot.StatusValue == SlotStatus.Closed)
        {
            throw new BusinessRuleException(ReservationMessages.SlotClosed);
        }

        DateTime startUtc = ToUtc(slot.StartTime);

        if (!IsInFuture(startUtc))
        {
            throw new BusinessRuleException(ReservationMessages.SlotStarted);
        }

        if (!IsWithinBookingWindow(startUtc))
        {
            throw new BusinessRuleException(ReservationMessages.OutsideBookingWindow(_policy.BookingWindowDays));
        }

        EnsureDirectionSupported(slot, direction);
    }

    // Rejects a direction the slot does not accept.
    private static void EnsureDirectionSupported(EnergyBookingSlot slot, EnergyDirection direction)
    {
        if (!SupportsDirection(slot, direction))
        {
            throw new BusinessRuleException(ReservationMessages.DirectionNotSupported(direction.ToString()));
        }
    }

    // Rejects a second active booking by the same prosumer on the same slot.
    private async Task EnsureNoDuplicateBookingAsync(string prosumerId, string slotId, string? excludeReservationId)
    {
        bool duplicate = await reservationRepository.ExistsForProsumerOnSlotAsync(
            prosumerId, slotId, ActiveStatuses, excludeReservationId);

        if (duplicate)
        {
            throw new BusinessRuleException(ReservationMessages.DuplicateBooking);
        }
    }

    // Rejects a booking when every position on the slot is taken.
    private static void EnsureFreePosition(EnergyBookingSlot slot)
    {
        if (!HasFreePosition(slot))
        {
            throw new BusinessRuleException(ReservationMessages.NoFreePosition);
        }
    }

    // Rejects a request for more kWh than the slot has left.
    private static void EnsureKwhHeadroom(EnergyBookingSlot slot, double extraKwh)
    {
        if (!HasKwhHeadroom(slot, extraKwh))
        {
            double availableKwh = Math.Max(0, slot.CapacityKwh - slot.ReservedKwh);
            throw new BusinessRuleException(ReservationMessages.InsufficientCapacity(availableKwh));
        }
    }

    // Requires the reservation to be Pending or Approved and still outside the minimum notice period.
    private void EnsureCanBeChanged(EnergyReservation reservation)
    {
        if (!IsModifiableState(reservation.StatusValue))
        {
            throw new ConflictException(ReservationMessages.InvalidState(reservation.Status));
        }

        // Measured against the booking's existing start time, never a newly requested one.
        if (!HasSufficientNotice(reservation.SlotStartUtc))
        {
            throw new BusinessRuleException(ReservationMessages.InsufficientNotice(_policy.MinimumNoticeHours));
        }
    }

    // Reports whether a time is after the current UTC time.
    private bool IsInFuture(DateTime startUtc) => startUtc > UtcNow;

    // Reports whether a start time is no more than the booking window ahead of now; a ceiling, not a floor.
    private bool IsWithinBookingWindow(DateTime startUtc) =>
        startUtc <= UtcNow.AddDays(_policy.BookingWindowDays);

    // Reports whether a start time is at least the minimum notice period away.
    private bool HasSufficientNotice(DateTime startUtc) =>
        startUtc - UtcNow >= TimeSpan.FromHours(_policy.MinimumNoticeHours);

    // Reports whether the reservation is in a state that can still be changed or cancelled.
    private static bool IsModifiableState(ReservationStatus status) => ActiveStatuses.Contains(status);

    // Reports whether the slot accepts the direction; a slot with no listed directions accepts both.
    private static bool SupportsDirection(EnergyBookingSlot slot, EnergyDirection direction) =>
        slot.SupportedDirections.Count == 0 || slot.SupportedDirectionValues.Contains(direction);

    // Reports whether the slot still has an unreserved position.
    private static bool HasFreePosition(EnergyBookingSlot slot) => slot.ReservedPositions < slot.TotalPositions;

    // Reports whether the slot can take the extra kWh on top of what is already reserved.
    private static bool HasKwhHeadroom(EnergyBookingSlot slot, double extraKwh) =>
        slot.ReservedKwh + extraKwh <= slot.CapacityKwh;

    // Atomically reserves capacity; if another request took it since the checks, reports a conflict.
    private async Task ReserveCapacityAsync(string slotId, int positions, double kwh)
    {
        var updatedSlot = await slotRepository.TryAdjustReservedCapacityAsync(slotId, positions, kwh);
        if (updatedSlot == null)
        {
            throw new ConflictException(ReservationMessages.CapacityRace);
        }

        await SyncSlotStatusAsync(updatedSlot);
    }

    // Returns capacity to a slot and refreshes its Full or Available status.
    private async Task ReleaseCapacityAsync(string slotId, int positions, double kwh)
    {
        var updatedSlot = await slotRepository.TryAdjustReservedCapacityAsync(slotId, -positions, -kwh);
        if (updatedSlot != null)
        {
            await SyncSlotStatusAsync(updatedSlot);
        }
    }

    // A slot is Full when it has no free position or no kWh left; a Closed slot is left as the operator set it.
    private async Task SyncSlotStatusAsync(EnergyBookingSlot slot)
    {
        SlotStatus current = slot.StatusValue;
        if (current == SlotStatus.Closed)
        {
            return;
        }

        bool isFull = !HasFreePosition(slot) || slot.ReservedKwh >= slot.CapacityKwh;
        SlotStatus target = isFull ? SlotStatus.Full : SlotStatus.Available;

        if (target != current)
        {
            await slotRepository.TryUpdateStatusAsync(slot, target);
        }
    }

    // Saves the reservation if nobody changed it meanwhile; otherwise undoes any capacity already reserved and reports a conflict.
    private async Task SaveOrRollbackAsync(EnergyReservation reservation, Func<Task>? rollback)
    {
        if (await reservationRepository.TryReplaceAsync(reservation))
        {
            return;
        }

        if (rollback != null)
        {
            await rollback();
        }

        throw new ConflictException(ReservationMessages.ConcurrentChange);
    }

    // Builds the summary returned by every endpoint, including whether the reservation can still be changed.
    private ReservationSummaryResponse BuildSummary(
        EnergyReservation reservation, string stationName, string message, bool includeQrToken = false)
    {
        bool changeable = IsModifiableState(reservation.StatusValue) && HasSufficientNotice(reservation.SlotStartUtc);

        return new ReservationSummaryResponse
        {
            ReservationId = reservation.Id,
            ReservationNo = reservation.ReservationNo,
            ProsumerNic = reservation.ProsumerNic,
            Status = reservation.StatusValue,
            StationId = reservation.StationId,
            StationName = stationName,
            SlotId = reservation.SlotId,
            SlotStartUtc = reservation.SlotStartUtc,
            SlotEndUtc = reservation.SlotEndUtc,
            Direction = reservation.DirectionValue,
            RequestedKwh = reservation.RequestedKwh,
            CreatedAtUtc = reservation.CreatedAtUtc,
            UpdatedAtUtc = reservation.UpdatedAtUtc,
            CanModify = changeable,
            CanCancel = changeable,
            RejectionReason = reservation.RejectionReason,
            QrToken = includeQrToken && reservation.StatusValue == ReservationStatus.Approved ? reservation.QrToken : null,
            Message = message
        };
    }

    // Builds a human-readable reservation number such as RES-20261001-3F9A1C2B.
    private static string GenerateReservationNo(DateTime nowUtc) =>
        $"RES-{nowUtc:yyyyMMdd}-{RandomNumberGenerator.GetHexString(ReservationNoRandomLength)}";

    // Treats a time with no kind as UTC and converts any other time to UTC.
    private static DateTime ToUtc(DateTime value) =>
        value.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(value, DateTimeKind.Utc)
            : value.ToUniversalTime();

    public async Task<DashboardAnalyticsResponseDto> GetDashboardAnalyticsAsync()
    {
        var counts = await reservationRepository.GetDashboardAnalyticsAsync(UtcNow);
        return new DashboardAnalyticsResponseDto
        {
            ActiveReservations = counts.Active,
            PendingReservations = counts.Pending,
            ApprovedFutureReservations = counts.ApprovedFuture
        };
    }

    public async Task<IEnumerable<ReservationSummaryResponse>> GetBookingHistoryAsync(
        string? nic, DateTime? fromUtc, DateTime? toUtc, ReservationStatus? status, string? stationId, string? slotId = null,
        bool includeQrToken = false)
    {
        var reservations = await reservationRepository.GetBookingHistoryAsync(nic, fromUtc, toUtc, status, stationId, slotId);
        
        var results = new List<ReservationSummaryResponse>();
        foreach (var res in reservations)
        {
            string stationName = await GetStationNameAsync(res.StationId);
            results.Add(BuildSummary(res, stationName, "", includeQrToken));
        }

        return results;
    }
}
