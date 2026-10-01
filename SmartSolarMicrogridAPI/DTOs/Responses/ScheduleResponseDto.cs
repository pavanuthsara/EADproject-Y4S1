/*
 * File: ScheduleResponseDto.cs
 * Author: Ransilu Samaraweera
 * Group: 45
 * Description: DTO for a station booking schedule (booking slot) response.
 * Individual Contribution: Implemented the response DTO for station schedules.
 */

namespace SmartSolarMicrogridAPI.DTOs.Responses;

public class ScheduleResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string StationId { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public int TotalPositions { get; set; }
    public int ReservedPositions { get; set; }
    public double CapacityKwh { get; set; }
    public double ReservedKwh { get; set; }
    public List<string> SupportedDirections { get; set; } = new();
    public string Status { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
}
