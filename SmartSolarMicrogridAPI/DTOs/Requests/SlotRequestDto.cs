/*
 * File: SlotRequestDto.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: Request body for creating a booking slot at a station, and for replacing
 *              all of its details when editing it.
 *
 * Individual Contribution: Defined the slot create and edit request.
 */

using System.ComponentModel.DataAnnotations;
using SmartSolarMicrogridAPI.Common.Enums;

namespace SmartSolarMicrogridAPI.DTOs.Requests;

public class SlotRequestDto
{
    [Required]
    public DateTime? StartTime { get; set; }

    [Required]
    public DateTime? EndTime { get; set; }

    // How many prosumers can hold this slot at the same time; limited by the station's battery bays.
    [Range(1, 1000)]
    public int TotalPositions { get; set; }

    // Total energy the slot can handle; limited by the station's capacity.
    [Range(0.01, 1000000)]
    public double CapacityKwh { get; set; }

    // At least one of Inject (prosumer gives energy) and Draw (prosumer takes energy).
    [Required]
    [MinLength(1, ErrorMessage = "Choose at least one supported direction (Inject or Draw).")]
    public List<EnergyDirection>? SupportedDirections { get; set; }
}
