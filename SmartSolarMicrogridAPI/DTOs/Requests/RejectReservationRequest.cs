/*
 * File: RejectReservationRequest.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 42
 * Description: Request body staff send when rejecting a reservation.
 *
 * Individual Contribution: Defined the reject reservation request.
 */

using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogridAPI.DTOs.Requests;

public class RejectReservationRequest
{
    // Shown to the prosumer so they know why the booking was refused.
    [Required]
    [StringLength(300, MinimumLength = 3)]
    public string Reason { get; set; } = string.Empty;
}
