/*
 * File: ReservationStatus.cs
 * Purpose: Defines the lifecycle states of an energy reservation.
 */

using System.Text.Json.Serialization;

namespace SmartSolarMicrogridAPI.Common.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ReservationStatus
{
    Pending,
    Approved,
    Rejected,
    Completed,
    Cancelled
}
