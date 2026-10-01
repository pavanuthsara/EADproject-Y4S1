/*
 * File: UpdateReservationRequest.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: Request body for updating an energy reservation. Every field is optional;
 *              only the fields sent are changed.
 *
 * Individual Contribution: Defined the update reservation contract and its shape
 *                          validation.
 */

using System.ComponentModel.DataAnnotations;
using SmartSolarMicrogridAPI.Common.Enums;

namespace SmartSolarMicrogridAPI.DTOs.Requests;

public class UpdateReservationRequest
{
    public string? ProsumerNic { get; set; }
    
    public string? SlotId { get; set; }

    public EnergyDirection? Direction { get; set; }

    [Range(double.Epsilon, double.MaxValue, ErrorMessage = "requestedKwh must be greater than zero.")]
    public double? RequestedKwh { get; set; }
}
