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
    Task<EnergyBookingSlot?> GetByIdAsync(string id);

    // Returns the updated slot, or null when the slot is missing or an increase would exceed its limits.
    Task<EnergyBookingSlot?> TryAdjustReservedCapacityAsync(string slotId, int positionsDelta, double kwhDelta);

    // Sets the status only if the slot's status and counters still equal the observed ones; returns whether it was changed.
    Task<bool> TryUpdateStatusAsync(EnergyBookingSlot observedSlot, SlotStatus newStatus);
}
