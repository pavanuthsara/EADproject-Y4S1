/*
 * File: ReservationPolicyOptions.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 42
 * Description: Strongly typed reservation policy values bound from the ReservationPolicy
 *              configuration section, so the booking window and notice period are
 *              changed in configuration rather than in code.
 *
 * Individual Contribution: Implemented the configurable 7-day booking window and
 *                          12-hour minimum notice policy for energy reservations.
 */

using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogridAPI.Configuration;

public class ReservationPolicyOptions
{
    public const string SectionName = "ReservationPolicy";

    [Range(1, int.MaxValue, ErrorMessage = "ReservationPolicy__BookingWindowDays must be at least 1.")]
    public int BookingWindowDays { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "ReservationPolicy__MinimumNoticeHours must be at least 1.")]
    public int MinimumNoticeHours { get; set; }
}
