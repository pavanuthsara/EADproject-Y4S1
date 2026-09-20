/*
 * File: SlotStatus.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: Defines the availability states of an energy booking slot.
 *
 * Individual Contribution: Defined the SlotStatus enum for booking slot availability.
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
