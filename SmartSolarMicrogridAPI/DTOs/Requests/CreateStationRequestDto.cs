/*
 * File: CreateStationRequestDto.cs
 * Author: Ransilu Samaraweera
 * Group: 45
 * Description: DTO for registering a new solar station.
 * Individual Contribution: Implemented DTO for solar station registration.
 */

using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogridAPI.DTOs.Requests;

public class CreateStationRequestDto
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string StationName { get; set; } = string.Empty;

    [Required]
    [StringLength(20, MinimumLength = 2)]
    public string StationCode { get; set; } = string.Empty;

    // Nullable so that an omitted coordinate is rejected instead of silently becoming 0.
    [Required]
    [Range(-90.0, 90.0)]
    public double? Latitude { get; set; }

    [Required]
    [Range(-180.0, 180.0)]
    public double? Longitude { get; set; }

    [Required]
    public string AddressLine { get; set; } = string.Empty;

    [Required]
    public string City { get; set; } = string.Empty;

    [Range(0.01, 1000000)]
    public double CapacityKwh { get; set; }

    // Number of battery storage slots (bays) available at the station.
    [Range(1, 1000)]
    public int TotalBays { get; set; }
}
