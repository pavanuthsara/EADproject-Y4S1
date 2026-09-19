/*
 * File: HealthStatusResponse.cs
 * Purpose: Response DTO describing the API's database connection status.
 */

namespace SmartSolarMicrogridAPI.DTOs.Responses;

public class HealthStatusResponse
{
    public bool DatabaseConnected { get; set; }
    public string DatabaseName { get; set; } = string.Empty;
    public long ResponseTimeMs { get; set; }
}
