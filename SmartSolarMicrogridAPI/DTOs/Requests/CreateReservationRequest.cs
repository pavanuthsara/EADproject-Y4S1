/*
 * File: CreateReservationRequest.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 42
 * Description: Request body for creating an energy reservation. Carries only what the
 *              prosumer chooses; the prosumer identity, status and timestamps are set by
 *              the server.
 *
 * Individual Contribution: Defined the create reservation contract and its shape
 *                          validation.
 */

using System.ComponentModel.DataAnnotations;
using SmartSolarMicrogridAPI.Common.Enums;

namespace SmartSolarMicrogridAPI.DTOs.Requests;

public class CreateReservationRequest
{
    public string? ProsumerNic { get; set; }

    [Required]
    public string StationId { get; set; } = string.Empty;

    [Required]
    public string SlotId { get; set; } = string.Empty;

    // Nullable so that an omitted direction is rejected instead of defaulting to Inject.
    [Required]
    public EnergyDirection? Direction { get; set; }

    [Required]
    [Range(double.Epsilon, double.MaxValue, ErrorMessage = "requestedKwh must be greater than zero.")]
    public double? RequestedKwh { get; set; }
}
