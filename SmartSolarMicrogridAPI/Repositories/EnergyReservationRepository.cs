/*
 * File: EnergyReservationRepository.cs
 * Purpose: MongoDB data access for the energyReservations collection.
 */

using MongoDB.Driver;
using SmartSolarMicrogridAPI.Common.Enums;
using SmartSolarMicrogridAPI.Data;
using SmartSolarMicrogridAPI.Models.Entities;
using SmartSolarMicrogridAPI.Repositories.Interfaces;

namespace SmartSolarMicrogridAPI.Repositories;

public class EnergyReservationRepository : MongoRepository<EnergyReservation>, IEnergyReservationRepository
{
    // Binds the repository to the energyReservations collection.
    public EnergyReservationRepository(MongoDbContext context) : base(context.EnergyReservations)
    {
    }

    // Returns all reservations made by the prosumer with the given NIC.
    public async Task<IReadOnlyList<EnergyReservation>> GetByProsumerNicAsync(string prosumerNic)
    {
        return await Collection.Find(r => r.ProsumerNic == prosumerNic).ToListAsync();
    }

    // Returns all reservations made against the given slot.
    public async Task<IReadOnlyList<EnergyReservation>> GetBySlotIdAsync(string slotId)
    {
        return await Collection.Find(r => r.SlotId == slotId).ToListAsync();
    }

    // Returns the reservation carrying the given QR token, or null when none exists.
    public async Task<EnergyReservation?> GetByQrTokenAsync(string qrToken)
    {
        return await Collection.Find(r => r.QrToken == qrToken).FirstOrDefaultAsync();
    }

    // Reports whether the station has any pending or approved reservations.
    public async Task<bool> HasActiveReservationsForStationAsync(string stationId)
    {
        var activeStatuses = new[]
        {
            ReservationStatus.Pending.ToString(),
            ReservationStatus.Approved.ToString()
        };

        return await Collection
            .Find(r => r.StationId == stationId && activeStatuses.Contains(r.Status))
            .Limit(1)
            .AnyAsync();
    }
}
