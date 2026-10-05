/*
 * File: SlotAvailabilityRequestDto.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 42
 * Description: Request body for opening or closing a slot to new bookings.
 *
 * Individual Contribution: Defined the slot availability request.
 */

using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogridAPI.DTOs.Requests;

public class SlotAvailabilityRequestDto
{
    // true opens the slot to new bookings, false closes it. Existing bookings are not affected.
    [Required]
    public bool? Open { get; set; }
}
