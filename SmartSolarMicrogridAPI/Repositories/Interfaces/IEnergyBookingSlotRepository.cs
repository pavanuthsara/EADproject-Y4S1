/*
 * File: IEnergyBookingSlotRepository.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: Narrow data access contract for booking slots, including the atomic
 *              conditional update of the reserved capacity counters.
 *
 * Individual Contribution: Defined the slot lookup, atomic capacity adjustment and
 *                          compare-and-set status contract.
 */

using SmartSolarMicrogridAPI.Common.Enums;
using SmartSolarMicrogridAPI.Models.Entities;

namespace SmartSolarMicrogridAPI.Repositories.Interfaces;

public interface IEnergyBookingSlotRepository
{
    // Finds a slot by its ID, or null if it does not exist.
    Task<EnergyBookingSlot?> GetByIdAsync(string id);

    // Returns every slot of a station, earliest first.
    Task<IReadOnlyList<EnergyBookingSlot>> FindByStationAsync(string stationId);

    // Inserts a new slot.
    Task<EnergyBookingSlot> CreateAsync(EnergyBookingSlot slot);

    // Reports whether another slot at the station overlaps the time window.
    Task<bool> HasOverlapAsync(string stationId, DateTime startUtc, DateTime endUtc, string? excludeSlotId);

    // Atomically replaces the slot's details only if they would not drop below what is already reserved
    // (and, when the time window changes, only if nothing is reserved); returns null when that check fails.
    Task<EnergyBookingSlot?> TryUpdateDetailsAsync(
        string slotId, DateTime startUtc, DateTime endUtc, int totalPositions, double capacityKwh,
        IReadOnlyList<string> supportedDirections, bool timeWindowChanging);

    // Closes the slot, or reopens it as Available or Full depending on its counters; null when it no longer exists.
    Task<EnergyBookingSlot?> TrySetOpenAsync(string slotId, bool open);

    // Deletes the slot only if nothing is reserved on it; returns whether it was deleted.
    Task<bool> TryDeleteUnreservedAsync(string slotId);

    // Returns the updated slot, or null when the slot is missing or an increase would exceed its limits.
    Task<EnergyBookingSlot?> TryAdjustReservedCapacityAsync(string slotId, int positionsDelta, double kwhDelta);

    // Sets the status only if the slot's status and counters still equal the observed ones; returns whether it was changed.
    Task<bool> TryUpdateStatusAsync(EnergyBookingSlot observedSlot, SlotStatus newStatus);
}
