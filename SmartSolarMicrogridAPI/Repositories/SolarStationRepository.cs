/*
 * File: SolarStationRepository.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: MongoDB data access for the solarStations collection.
 *
 * Individual Contribution: Implemented the station repository on top of the generic
 *                          MongoDB repository.
 */

using SmartSolarMicrogridAPI.Data;
using SmartSolarMicrogridAPI.Models.Entities;
using SmartSolarMicrogridAPI.Repositories.Interfaces;

namespace SmartSolarMicrogridAPI.Repositories;

public class SolarStationRepository(MongoDbContext context)
    : MongoRepository<SolarStation>(context.SolarStations), ISolarStationRepository;
