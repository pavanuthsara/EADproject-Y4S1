/*
 * File: HealthStatusResponse.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: Response DTO describing the API's database connection status.
 *
 * Individual Contribution: Implemented the health check response DTO.
 */

namespace SmartSolarMicrogridAPI.DTOs.Responses;

public class HealthStatusResponse
{
    public bool DatabaseConnected { get; set; }
    public string DatabaseName { get; set; } = string.Empty;
    public long ResponseTimeMs { get; set; }
}
