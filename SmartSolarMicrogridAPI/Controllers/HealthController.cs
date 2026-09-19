/*
 * File: HealthController.cs
 * Purpose: Exposes the health check endpoint used to verify the API and database are reachable.
 */

using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogridAPI.Common.Responses;
using SmartSolarMicrogridAPI.DTOs.Responses;
using SmartSolarMicrogridAPI.Services.Interfaces;

namespace SmartSolarMicrogridAPI.Controllers;

[ApiController]
[Route("api/health")]
public class HealthController : ControllerBase
{
    private readonly IHealthService _healthService;

    // Stores the health service used to answer requests.
    public HealthController(IHealthService healthService)
    {
        _healthService = healthService;
    }

    // Returns 200 with the database status when connected, otherwise 503.
    [HttpGet]
    public async Task<ActionResult<ApiResponse<HealthStatusResponse>>> GetAsync()
    {
        var health = await _healthService.GetHealthAsync();

        if (!health.DatabaseConnected)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new ApiResponse<HealthStatusResponse> { Success = false, Message = "Database is unreachable.", Data = health });
        }

        return Ok(ApiResponse<HealthStatusResponse>.Ok(health, "API is healthy."));
    }
}
