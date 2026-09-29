/*
 * File: IEnergyReservationRepository.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: Narrow data access contract for energy reservations, including the
 *              version-checked replace used for optimistic concurrency.
 *
 * Individual Contribution: Defined the reservation lookup, insert, duplicate search and
 *                          version-checked save contract.
 */

using SmartSolarMicrogridAPI.Common.Enums;
using SmartSolarMicrogridAPI.Models.Entities;

namespace SmartSolarMicrogridAPI.Repositories.Interfaces;

public interface IEnergyReservationRepository
{
    Task<EnergyReservation?> GetByIdAsync(string id);

    Task<EnergyReservation> CreateAsync(EnergyReservation reservation);

    // Replaces the reservation only if its stored version still matches; returns whether it was saved.
    Task<bool> TryReplaceAsync(EnergyReservation reservation);

    // Reports whether the prosumer has a reservation on the slot in one of the given statuses.
    Task<bool> ExistsForProsumerOnSlotAsync(
        string prosumerId,
        string slotId,
        IReadOnlyCollection<ReservationStatus> statuses,
        string? excludeReservationId);

    Task<(long Active, long Pending, long ApprovedFuture)> GetDashboardAnalyticsAsync(DateTime nowUtc);

    Task<IReadOnlyList<EnergyReservation>> GetBookingHistoryAsync(
        string? prosumerNic,
        DateTime? fromUtc,
        DateTime? toUtc,
        ReservationStatus? status,
        string? stationId);
}
