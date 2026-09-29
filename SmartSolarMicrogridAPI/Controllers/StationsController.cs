/*
 * File: StationsController.cs
 * Author: Ransilu Samaraweera
 * Group: 45
 * Description: Endpoints for solar station registration, schedule updates and deactivation.
 * Individual Contribution: Implemented the station endpoints with role-based authorization.
 */

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogridAPI.Common.Constants;
using SmartSolarMicrogridAPI.Common.Responses;
using SmartSolarMicrogridAPI.DTOs.Requests;
using SmartSolarMicrogridAPI.DTOs.Responses;
using SmartSolarMicrogridAPI.Services.Interfaces;

namespace SmartSolarMicrogridAPI.Controllers;

[ApiController]
[Route("api/stations")]
public class StationsController(IStationService stationService) : ControllerBase
{
    // Registers a new solar station (GPS location, kWh capacity, battery storage slots).
    [HttpPost]
    [Authorize(Roles = RoleConstants.Backoffice)]
    public async Task<ActionResult<ApiResponse<StationResponseDto>>> CreateStationAsync([FromBody] CreateStationRequestDto dto)
    {
        string? userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var result = await stationService.CreateStationAsync(dto, userId);
        return Ok(ApiResponse<StationResponseDto>.Ok(result, "Station registered successfully."));
    }

    // Lets Grid Operators and Backoffice staff update a station's booking schedule.
    [HttpPut("{stationId}/schedules/{slotId}")]
    [Authorize(Roles = $"{RoleConstants.Backoffice},{RoleConstants.GridOperator}")]
    public async Task<ActionResult<ApiResponse<ScheduleResponseDto>>> UpdateScheduleAsync(
        string stationId, string slotId, [FromBody] UpdateScheduleRequestDto dto)
    {
        var result = await stationService.UpdateScheduleAsync(stationId, slotId, dto);
        return Ok(ApiResponse<ScheduleResponseDto>.Ok(result, "Schedule updated successfully."));
    }

    // Deactivates a station; blocked while it has active energy reservations.
    [HttpPut("{stationId}/deactivate")]
    [Authorize(Roles = RoleConstants.Backoffice)]
    public async Task<ActionResult<ApiResponse<StationResponseDto>>> DeactivateStationAsync(string stationId)
    {
        string? userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var result = await stationService.DeactivateStationAsync(stationId, userId);
        return Ok(ApiResponse<StationResponseDto>.Ok(result, "Station deactivated successfully."));
    }

    // Retrieves nearby grid nodes (solar stations) for the mobile app map.
    [HttpGet("nearby")]
    [Authorize(Roles = RoleConstants.Prosumer)]
    public async Task<ActionResult<ApiResponse<IEnumerable<StationResponseDto>>>> GetNearbyStationsAsync(
        [FromQuery] double lat,
        [FromQuery] double lng,
        [FromQuery] double radiusMeters = 10000)
    {
        var result = await stationService.GetNearbyStationsAsync(lat, lng, radiusMeters);
        return Ok(ApiResponse<IEnumerable<StationResponseDto>>.Ok(result, "Nearby stations retrieved."));
    }
}
