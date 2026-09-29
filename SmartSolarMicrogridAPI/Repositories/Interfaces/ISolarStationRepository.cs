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
    Task<SolarStation?> GetByIdAsync(string id);
}
