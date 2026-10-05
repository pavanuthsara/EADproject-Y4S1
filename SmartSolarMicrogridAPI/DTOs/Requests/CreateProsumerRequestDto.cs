/*
 * File: CreateProsumerRequestDto.cs
 * Author: Pavan Uthsara (IT23158986)
 * Group: 42
 * Description: DTO for backoffice to create a prosumer.
 * Individual Contribution: Implemented DTO for prosumer creation by backoffice.
 */
using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogridAPI.DTOs.Requests;

public class CreateProsumerRequestDto
{
    [Required]
    [StringLength(12, MinimumLength = 10)]
    public string Nic { get; set; } = string.Empty;

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
    [StringLength(100, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;

    [Required]
    public string Address { get; set; } = string.Empty;

    [Range(0, 1000)]
    public double SolarCapacityKw { get; set; }
}
