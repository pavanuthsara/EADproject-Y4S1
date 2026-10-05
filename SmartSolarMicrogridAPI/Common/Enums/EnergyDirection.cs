/*
 * File: EnergyDirection.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 42
 * Description: Defines whether a reservation injects energy into or draws energy from
 *              the grid.
 *
 * Individual Contribution: Defined the EnergyDirection enum for inject and draw
 *                          reservations.
 */

using System.Text.Json.Serialization;

namespace SmartSolarMicrogridAPI.Common.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum EnergyDirection
{
    Inject,
    Draw
}
