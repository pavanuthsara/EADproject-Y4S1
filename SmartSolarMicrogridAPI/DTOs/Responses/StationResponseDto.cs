/*
 * File: StationResponseDto.cs
 * Author: Ransilu Samaraweera
 * Group: 42
 * Description: DTO for solar station data response.
 * Individual Contribution: Implemented the response DTO to standardize station data payload.
 */

namespace SmartSolarMicrogridAPI.DTOs.Responses;

public class StationResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string StationName { get; set; } = string.Empty;
    public string StationCode { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string AddressLine { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public double CapacityKwh { get; set; }
    public int TotalBays { get; set; }
    public string? OperatingSchedule { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? DeactivatedAt { get; set; }
}
