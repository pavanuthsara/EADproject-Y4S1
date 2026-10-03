/*
 * File: UpdateOperatingScheduleRequestDto.cs
 * Author: Ransilu Samaraweera
 * Group: 45
 * Description: DTO for changing a solar station's daily operating hours.
 * Individual Contribution: Implemented DTO for operating schedule updates.
 */

using System.ComponentModel.DataAnnotations;
using SmartSolarMicrogridAPI.Common.Helpers;

namespace SmartSolarMicrogridAPI.DTOs.Requests;

public class UpdateOperatingScheduleRequestDto
{
    // Daily operating window, e.g. "06:00-18:00".
    [Required]
    [RegularExpression(OperatingScheduleHelper.Pattern, ErrorMessage = OperatingScheduleHelper.FormatErrorMessage)]
    public string OperatingSchedule { get; set; } = string.Empty;
}
