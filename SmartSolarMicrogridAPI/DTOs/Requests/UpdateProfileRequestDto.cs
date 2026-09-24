/*
 * File: UpdateProfileRequestDto.cs
 * Author: Pavan Uthsara (IT23158986)
 * Group: 45
 * Description: DTO for updating a prosumer profile.
 * Individual Contribution: Implemented DTO for profile updates.
 */

using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogridAPI.DTOs.Requests;

public class UpdateProfileRequestDto
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [Phone]
    public string Phone { get; set; } = string.Empty;

    [Required]
    public string Address { get; set; } = string.Empty;

    [Range(0, 1000)]
    public double SolarCapacityKw { get; set; }
}
