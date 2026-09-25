/*
 * File: UpdateScheduleRequestDto.cs
 * Author: Ransilu Samaraweera
 * Group: 45
 * Description: DTO for updating a solar station's booking schedule (booking slot).
 * Individual Contribution: Implemented DTO for schedule updates.
 */

using System.ComponentModel.DataAnnotations;
using SmartSolarMicrogridAPI.Common.Enums;

namespace SmartSolarMicrogridAPI.DTOs.Requests;

// Full replacement of a slot's schedule, so every field is required.
public class UpdateScheduleRequestDto
{
    [Required]
    public DateTime? StartTime { get; set; }

    [Required]
    public DateTime? EndTime { get; set; }

    [Range(1, 1000)]
    public int TotalPositions { get; set; }

    // Only Available or Closed can be requested; Full is derived from the reservations.
    [Required]
    public SlotStatus? Status { get; set; }
}
