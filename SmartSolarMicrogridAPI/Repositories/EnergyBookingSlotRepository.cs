/*
 * File: EnergyBookingSlotRepository.cs
 * Purpose: MongoDB data access for the energyBookingSlots collection.
 */

using MongoDB.Driver;
using SmartSolarMicrogridAPI.Data;
using SmartSolarMicrogridAPI.Models.Entities;
using SmartSolarMicrogridAPI.Repositories.Interfaces;

namespace SmartSolarMicrogridAPI.Repositories;

public class EnergyBookingSlotRepository(MongoDbContext context)
    : MongoRepository<EnergyBookingSlot>(context.EnergyBookingSlots), IEnergyBookingSlotRepository
{
    // Returns all slots belonging to the given station.
    public async Task<IReadOnlyList<EnergyBookingSlot>> GetByStationIdAsync(string stationId)
    {
        return await Collection.Find(s => s.StationId == stationId).ToListAsync();
    }

    // Returns all slots starting within the given UTC range, from inclusive to exclusive.
    public async Task<IReadOnlyList<EnergyBookingSlot>> GetByDateRangeAsync(DateTime fromUtc, DateTime toUtc)
    {
        return await Collection.Find(s => s.StartTime >= fromUtc && s.StartTime < toUtc).ToListAsync();
    }
}
