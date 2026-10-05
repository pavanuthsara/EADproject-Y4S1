/*
 * File: SolarStationRepository.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: MongoDB data access for the solarStations collection.
 *
 * Individual Contribution: Implemented the station repository on top of the generic
 *                          MongoDB repository.
 */

using MongoDB.Driver;
using SmartSolarMicrogridAPI.Data;
using SmartSolarMicrogridAPI.Models.Entities;
using SmartSolarMicrogridAPI.Repositories.Interfaces;

namespace SmartSolarMicrogridAPI.Repositories;

public class SolarStationRepository(MongoDbContext context)
    : MongoRepository<SolarStation>(context.SolarStations), ISolarStationRepository
{
    // Finds active stations within the given distance of a point, nearest first.
    public async Task<IReadOnlyList<SolarStation>> FindNearbyAsync(double longitude, double latitude, double maxDistanceMeters)
    {
        var point = MongoDB.Driver.GeoJsonObjectModel.GeoJson.Point(
            MongoDB.Driver.GeoJsonObjectModel.GeoJson.Geographic(longitude, latitude));

        var filter = Builders<SolarStation>.Filter.NearSphere(s => s.Location, point, maxDistanceMeters);

        // Optional: you might want to filter only "Active" stations
        filter &= Builders<SolarStation>.Filter.Eq(s => s.Status, Common.Enums.StationStatus.Active.ToString());

        return await Collection.Find(filter).ToListAsync();
    }
}
