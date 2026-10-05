/*
 * File: EnergyReservationRepository.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 42
 * Description: MongoDB data access for the energyReservations collection, including a
 *              version-checked replace so concurrent changes cannot both be saved.
 *
 * Individual Contribution: Implemented the reservation repository, the duplicate booking
 *                          query and optimistic concurrency on save.
 */

using MongoDB.Driver;
using SmartSolarMicrogridAPI.Common.Enums;
using SmartSolarMicrogridAPI.Data;
using SmartSolarMicrogridAPI.Models.Entities;
using SmartSolarMicrogridAPI.Repositories.Interfaces;

namespace SmartSolarMicrogridAPI.Repositories;

public class EnergyReservationRepository(MongoDbContext context)
    : MongoRepository<EnergyReservation>(context.EnergyReservations), IEnergyReservationRepository
{
    // Replaces the document only if its version is unchanged since it was read, then bumps the version.
    public async Task<bool> TryReplaceAsync(EnergyReservation reservation)
    {
        int expectedVersion = reservation.Version;

        var versionMatches = Builders<EnergyReservation>.Filter.Eq(r => r.Version, expectedVersion);
        if (expectedVersion == 0)
        {
            versionMatches |= Builders<EnergyReservation>.Filter.Exists(r => r.Version, false);
        }

        var filter = Builders<EnergyReservation>.Filter.Eq(r => r.Id, reservation.Id) & versionMatches;

        reservation.Version = expectedVersion + 1;
        var result = await Collection.ReplaceOneAsync(filter, reservation);

        if (result.MatchedCount == 0)
        {
            reservation.Version = expectedVersion;
            return false;
        }

        return true;
    }

    // Reports whether the prosumer holds a reservation on the slot in one of the given statuses.
    public async Task<bool> ExistsForProsumerOnSlotAsync(
        string prosumerId,
        string slotId,
        IReadOnlyCollection<ReservationStatus> statuses,
        string? excludeReservationId)
    {
        var statusNames = statuses.Select(s => s.ToString()).ToList();

        var filter = Builders<EnergyReservation>.Filter.Eq(r => r.ProsumerId, prosumerId)
            & Builders<EnergyReservation>.Filter.Eq(r => r.SlotId, slotId)
            & Builders<EnergyReservation>.Filter.In(r => r.Status, statusNames);

        if (excludeReservationId != null)
        {
            filter &= Builders<EnergyReservation>.Filter.Ne(r => r.Id, excludeReservationId);
        }

        return await Collection.Find(filter).Limit(1).AnyAsync();
    }

    // Counts Approved, Pending and future Approved reservations for the dashboard.
    public async Task<(long Active, long Pending, long ApprovedFuture)> GetDashboardAnalyticsAsync(DateTime nowUtc)
    {
        var pendingFilter = Builders<EnergyReservation>.Filter.Eq(r => r.Status, ReservationStatus.Pending.ToString());
        long pendingCount = await Collection.CountDocumentsAsync(pendingFilter);

        var activeFilter = Builders<EnergyReservation>.Filter.Eq(r => r.Status, ReservationStatus.Approved.ToString());
        long activeCount = await Collection.CountDocumentsAsync(activeFilter);

        var futureFilter = activeFilter & Builders<EnergyReservation>.Filter.Gt(r => r.SlotStartUtc, nowUtc);
        long approvedFutureCount = await Collection.CountDocumentsAsync(futureFilter);

        return (activeCount, pendingCount, approvedFutureCount);
    }

    // Finds reservations matching the optional NIC, date range, status, station and slot filters.
    public async Task<IReadOnlyList<EnergyReservation>> GetBookingHistoryAsync(
        string? prosumerNic,
        DateTime? fromUtc,
        DateTime? toUtc,
        ReservationStatus? status,
        string? stationId,
        string? slotId)
    {
        var filter = Builders<EnergyReservation>.Filter.Empty;

        if (!string.IsNullOrEmpty(prosumerNic))
        {
            filter &= Builders<EnergyReservation>.Filter.Eq(r => r.ProsumerNic, prosumerNic);
        }

        if (fromUtc.HasValue)
        {
            filter &= Builders<EnergyReservation>.Filter.Gte(r => r.SlotStartUtc, fromUtc.Value);
        }

        if (toUtc.HasValue)
        {
            filter &= Builders<EnergyReservation>.Filter.Lte(r => r.SlotStartUtc, toUtc.Value);
        }

        if (status.HasValue)
        {
            filter &= Builders<EnergyReservation>.Filter.Eq(r => r.Status, status.Value.ToString());
        }

        if (!string.IsNullOrEmpty(stationId))
        {
            filter &= Builders<EnergyReservation>.Filter.Eq(r => r.StationId, stationId);
        }

        if (!string.IsNullOrEmpty(slotId))
        {
            filter &= Builders<EnergyReservation>.Filter.Eq(r => r.SlotId, slotId);
        }

        return await Collection.Find(filter).SortByDescending(r => r.CreatedAtUtc).ToListAsync();
    }

    // Returns the Pending and Approved reservations on a slot.
    public async Task<IReadOnlyList<EnergyReservation>> GetActiveBySlotAsync(string slotId)
    {
        var activeStatuses = new[] { ReservationStatus.Pending.ToString(), ReservationStatus.Approved.ToString() };

        return await Collection
            .Find(Builders<EnergyReservation>.Filter.Eq(r => r.SlotId, slotId)
                & Builders<EnergyReservation>.Filter.In(r => r.Status, activeStatuses))
            .ToListAsync();
    }
}
