/*
 * File: ReservationMessages.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: Holds the success messages and rule-specific error messages returned by the
 *              reservation endpoints, so every failure names the rule that rejected it.
 *
 * Individual Contribution: Defined the reservation messages, one per business rule, used
 *                          in API responses and report evidence.
 */

namespace SmartSolarMicrogridAPI.Common.Constants;

public static class ReservationMessages
{
    public const string Created = "Reservation created and awaiting operator approval.";
    public const string Updated = "Reservation updated.";
    public const string UpdatedApprovalReset = "Reservation updated. The terms changed, so it is back to Pending and needs approval again.";
    public const string NoChanges = "No changes were made to the reservation.";
    public const string Cancelled = "Reservation cancelled and its capacity released.";

    public const string MissingClaims = "Required prosumer claims are missing from the token.";
    public const string NothingToUpdate = "Provide at least one of slotId, direction or requestedKwh to update.";
    public const string NotOwner = "You can only change your own reservations.";
    public const string SlotClosed = "Slot not available: the operator has closed this slot.";
    public const string SlotStarted = "Slot already started: bookings are only accepted for slots that start in the future.";
    public const string DuplicateBooking = "Duplicate booking: you already hold an active reservation on this slot. Update it instead.";
    public const string NoFreePosition = "Slot capacity rule: every position on this slot is already reserved.";
    public const string CapacityRace = "Slot capacity changed while your request was processed. Please try again.";
    public const string ConcurrentChange = "This reservation was changed by another request. Reload it and try again.";

    // Builds the not-found message for a station that is missing or deactivated.
    public static string StationNotFound(string stationId) =>
        $"Station {stationId} was not found or is not active.";

    // Builds the not-found message for a slot that does not exist.
    public static string SlotNotFound(string slotId) =>
        $"Slot {slotId} was not found.";

    // Builds the not-found message for a slot that belongs to a different station.
    public static string SlotNotAtStation(string slotId, string stationId) =>
        $"Slot {slotId} was not found at station {stationId}.";

    // Builds the not-found message for a reservation.
    public static string ReservationNotFound(string reservationId) =>
        $"Reservation {reservationId} was not found.";

    // Builds the 7-day booking window error message.
    public static string OutsideBookingWindow(int days) =>
        $"Booking window rule: slots can only be booked up to {days} days in advance.";

    // Builds the 12-hour notice error message.
    public static string InsufficientNotice(int hours) =>
        $"Notice rule: reservations can only be changed or cancelled at least {hours} hours before the start time.";

    // Builds the direction error message.
    public static string DirectionNotSupported(string direction) =>
        $"Direction rule: this slot does not accept {direction} reservations.";

    // Builds the kWh capacity error message.
    public static string InsufficientCapacity(double availableKwh) =>
        $"Slot capacity rule: only {availableKwh:0.###} kWh is still available on this slot.";

    // Builds the invalid state error message.
    public static string InvalidState(string status) =>
        $"State rule: a {status} reservation can no longer be changed or cancelled.";
}
