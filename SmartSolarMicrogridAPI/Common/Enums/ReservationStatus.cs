/*
 * File: ReservationStatus.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 42
 * Description: Defines the lifecycle states of an energy reservation.
 *
 * Individual Contribution: Defined the ReservationStatus enum for the reservation
 *                          lifecycle.
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
