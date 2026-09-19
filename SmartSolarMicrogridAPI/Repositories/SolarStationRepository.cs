/*
 * File: SolarStationRepository.cs
 * Purpose: MongoDB data access for the solarStations collection.
 */

using MongoDB.Driver;
using SmartSolarMicrogridAPI.Data;
using SmartSolarMicrogridAPI.Models.Entities;
using SmartSolarMicrogridAPI.Repositories.Interfaces;

namespace SmartSolarMicrogridAPI.Repositories;

public class SolarStationRepository(MongoDbContext context)
    : MongoRepository<SolarStation>(context.SolarStations), ISolarStationRepository
{
    // Returns the station with the given code, or null when none exists.
    public async Task<SolarStation?> GetByStationCodeAsync(string stationCode)
    {
        return await Collection.Find(s => s.StationCode == stationCode).FirstOrDefaultAsync();
    }

    // Returns stations within the given radius of a point, nearest first.
    public async Task<IReadOnlyList<SolarStation>> GetNearbyAsync(double lat, double lng, double radiusMeters)
    {
        var filter = Builders<SolarStation>.Filter.NearSphere(s => s.Location, lng, lat, radiusMeters);
        return await Collection.Find(filter).ToListAsync();
    }
}
