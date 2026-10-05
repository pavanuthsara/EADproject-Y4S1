/*
 * File: CollectionNames.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 42
 * Description: Holds the MongoDB collection names used across the API.
 *
 * Individual Contribution: Defined the MongoDB collection name constants.
 */

namespace SmartSolarMicrogridAPI.Common.Constants;

public static class CollectionNames
{
    public const string Users = "users";
    public const string SolarStations = "solarStations";
    public const string EnergyBookingSlots = "energyBookingSlots";
    public const string EnergyReservations = "energyReservations";
}
