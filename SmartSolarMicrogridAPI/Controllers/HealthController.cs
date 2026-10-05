/*
 * File: HealthController.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 42
 * Description: Exposes the health check endpoint used to verify the API and database
 *              are reachable.
 *
 * Individual Contribution: Implemented the API health and database connection check
 *                          endpoints.
 */

using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogridAPI.Common.Constants;
using SmartSolarMicrogridAPI.Common.Responses;
using SmartSolarMicrogridAPI.DTOs.Responses;
using SmartSolarMicrogridAPI.Services.Interfaces;

namespace SmartSolarMicrogridAPI.Controllers;

[ApiController]
[Route("api/health")]
public class HealthController(IHealthService healthService) : ControllerBase
{
    // Returns 200 with the database status when connected, otherwise 503.
    [HttpGet]
    public Task<ActionResult<ApiResponse<HealthStatusResponse>>> GetAsync()
    {
        return BuildHealthResultAsync();
    }

    // Dedicated database connection check; returns 200 with connection details when connected, otherwise 503.
    [HttpGet("database")]
    public Task<ActionResult<ApiResponse<HealthStatusResponse>>> GetDatabaseAsync()
    {
        return BuildHealthResultAsync();
    }

    // Runs the health check and maps the result to a status code.
    private async Task<ActionResult<ApiResponse<HealthStatusResponse>>> BuildHealthResultAsync()
    {
        var health = await healthService.GetHealthAsync();

        if (!health.DatabaseConnected)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new ApiResponse<HealthStatusResponse> { Success = false, Message = ErrorMessages.DatabaseUnreachable, Data = health });
        }

        return Ok(ApiResponse<HealthStatusResponse>.Ok(health, SuccessMessages.ApiHealthy));
    }
}
