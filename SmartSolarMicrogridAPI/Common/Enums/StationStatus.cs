/*
 * File: StationStatus.cs
 * Author: Ransilu Samaraweera
 * Group: 45
 * Description: Defines the lifecycle states of a solar station.
 *
 * Individual Contribution: Defined the StationStatus enum for the solar station
 *                          lifecycle.
 */

using System.Text.Json.Serialization;

namespace SmartSolarMicrogridAPI.Common.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum StationStatus
{
    Active,
    Inactive
}
