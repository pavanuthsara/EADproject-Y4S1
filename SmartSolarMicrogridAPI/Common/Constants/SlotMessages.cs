/*
 * File: SlotMessages.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 42
 * Description: Success and rule-specific error messages for the booking slot endpoints.
 *
 * Individual Contribution: Defined the slot messages, one per business rule.
 */

namespace SmartSolarMicrogridAPI.Common.Constants;

public static class SlotMessages
{
    public const string Created = "Slot created.";
    public const string Updated = "Slot updated.";
    public const string Deleted = "Slot deleted.";
    public const string Opened = "Slot opened for bookings.";
    public const string Closed = "Slot closed to new bookings. Existing bookings are not affected.";

    public const string EndBeforeStart = "The end time must be after the start time.";
    public const string StartInPast = "The start time must be in the future.";
    public const string Overlap = "This time window overlaps another slot at the same station.";
    public const string NoDirections = "Choose at least one supported direction (Inject or Draw).";
    public const string TimeChangeWithBookings = "The time window cannot be changed while the slot has active reservations. Reject or cancel them first.";
    public const string ConcurrentChange = "The slot was changed by another request while you were saving. Reload it and try again.";
    public const string BookedWhileDeleting = "A reservation was made on this slot just now, so it was not deleted. Reload and try again.";

    // Builds the error for a slot count above the station's battery bays.
    public static string TooManyPositions(int totalBays) =>
        $"Total positions cannot exceed the station's {totalBays} battery bay(s).";

    // Builds the error for a slot capacity above the station's capacity.
    public static string TooMuchCapacity(double stationKwh) =>
        $"Slot capacity cannot exceed the station's {stationKwh:0.###} kWh.";

    // Builds the error for shrinking positions below what is already booked.
    public static string PositionsBelowBooked(int reserved) =>
        $"Total positions cannot be lower than the {reserved} position(s) already booked on this slot.";

    // Builds the error for shrinking capacity below what is already booked.
    public static string CapacityBelowBooked(double reservedKwh) =>
        $"Capacity cannot be lower than the {reservedKwh:0.###} kWh already booked on this slot.";

    // Builds the error for removing a direction that an active booking uses.
    public static string DirectionInUse(string direction) =>
        $"The {direction} direction cannot be removed while an active reservation uses it.";

    // Builds the error for deleting a slot that still has bookings.
    public static string HasActiveReservations(int count) =>
        $"This slot cannot be deleted because it has {count} active reservation(s). Reject or cancel them first.";

    // Builds the not-found message for a station that is missing or not active.
    public static string StationNotFound(string stationId) =>
        $"Station {stationId} was not found or is not active.";

    // Builds the not-found message for a slot at a station.
    public static string SlotNotFound(string slotId, string stationId) =>
        $"Slot {slotId} was not found at station {stationId}.";
}
