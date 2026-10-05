/*
 * File: ISolarStationRepository.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: Narrow data access contract for solar stations, exposing only what the
 *              reservation service needs.
 *
 * Individual Contribution: Defined the station lookup contract used by the reservation
 *                          service.
 */

using SmartSolarMicrogridAPI.Models.Entities;

namespace SmartSolarMicrogridAPI.Repositories.Interfaces;

public interface ISolarStationRepository
{
    // Finds a station by its ID, or null if it does not exist.
    Task<SolarStation?> GetByIdAsync(string id);

    // Finds active stations within the given distance of a point (longitude first, as in GeoJSON).
    Task<IReadOnlyList<SolarStation>> FindNearbyAsync(double longitude, double latitude, double maxDistanceMeters);
}
