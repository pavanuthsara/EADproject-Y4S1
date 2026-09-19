/*
 * File: ISolarStationRepository.cs
 * Purpose: Defines solar-station-specific data access on top of the generic repository contract.
 */

using SmartSolarMicrogridAPI.Models.Entities;

namespace SmartSolarMicrogridAPI.Repositories.Interfaces;

public interface ISolarStationRepository : IMongoRepository<SolarStation>
{
    Task<SolarStation?> GetByStationCodeAsync(string stationCode);
    Task<IReadOnlyList<SolarStation>> GetNearbyAsync(double lat, double lng, double radiusMeters);
}
