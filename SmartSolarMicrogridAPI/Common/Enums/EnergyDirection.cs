/*
 * File: EnergyDirection.cs
 * Purpose: Defines whether a reservation injects energy into or draws energy from the grid.
 */

using System.Text.Json.Serialization;

namespace SmartSolarMicrogridAPI.Common.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum EnergyDirection
{
    Inject,
    Draw
}
