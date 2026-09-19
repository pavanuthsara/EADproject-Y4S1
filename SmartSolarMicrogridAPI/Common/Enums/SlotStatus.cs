/*
 * File: SlotStatus.cs
 * Purpose: Defines the availability states of an energy booking slot.
 */

using System.Text.Json.Serialization;

namespace SmartSolarMicrogridAPI.Common.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum SlotStatus
{
    Available,
    Full,
    Closed
}
