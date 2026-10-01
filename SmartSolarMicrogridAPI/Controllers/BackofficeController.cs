/*
 * File: BackofficeController.cs
 * Author: Pavan Uthsara (IT23158986)
 * Group: 45
 * Description: Endpoints for Backoffice web app administration.
 * Individual Contribution: Implemented endpoints for prosumer creation and activation.
 */

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogridAPI.Common.Constants;
using SmartSolarMicrogridAPI.Common.Enums;
using SmartSolarMicrogridAPI.Common.Responses;
using SmartSolarMicrogridAPI.DTOs.Requests;
using SmartSolarMicrogridAPI.DTOs.Responses;
using SmartSolarMicrogridAPI.Services.Interfaces;

namespace SmartSolarMicrogridAPI.Controllers;

[ApiController]
[Route("api/backoffice")]
[Authorize(Roles = RoleConstants.Backoffice)]
public class BackofficeController(IUserService userService) : ControllerBase
{
    // Lists all prosumers
    [HttpGet("prosumers")]
    public async Task<ActionResult<ApiResponse<IEnumerable<UserResponseDto>>>> GetProsumersAsync()
    {
        var prosumers = await userService.GetAllProsumersAsync();
        return Ok(ApiResponse<IEnumerable<UserResponseDto>>.Ok(prosumers, "Prosumers retrieved."));
    }

    // Web App: Backoffice Registration & Approval (creates immediately Active prosumer)
    [HttpPost("prosumers")]
    public async Task<ActionResult<ApiResponse<UserResponseDto>>> CreateProsumerAsync([FromBody] CreateProsumerRequestDto dto)
    {
        var result = await userService.CreateProsumerByBackofficeAsync(dto);
        return Ok(ApiResponse<UserResponseDto>.Ok(result, "Prosumer created and activated successfully."));
    }

    // Activating Mobile Registrations
    [HttpPut("prosumers/{nic}/activate")]
    public async Task<ActionResult<ApiResponse<UserResponseDto>>> ActivateProsumerAsync(string nic)
    {
        string? adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (adminId == null) return Unauthorized();

        var result = await userService.ActivateProsumerAsync(nic, adminId);
        return Ok(ApiResponse<UserResponseDto>.Ok(result, "Prosumer activated successfully."));
    }

    // Allows Backoffice to update profiles
    [HttpPut("prosumers/{nic}")]
    public async Task<ActionResult<ApiResponse<UserResponseDto>>> UpdateProsumerAsync(string nic, [FromBody] UpdateProfileRequestDto dto)
    {
        var result = await userService.UpdateProsumerProfileAsync(nic, dto);
        return Ok(ApiResponse<UserResponseDto>.Ok(result, "Prosumer profile updated successfully."));
    }

    // Backoffice deactivates prosumer
    [HttpPut("prosumers/{nic}/deactivate")]
    public async Task<ActionResult<ApiResponse<UserResponseDto>>> DeactivateProsumerAsync(string nic)
    {
        string? adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (adminId == null) return Unauthorized();

        var result = await userService.DeactivateProsumerAsync(nic, adminId);
        return Ok(ApiResponse<UserResponseDto>.Ok(result, "Prosumer deactivated successfully."));
    }

    // Dashboard Analytics: returns counts of reservations
    [HttpGet("dashboard/analytics")]
    public async Task<ActionResult<ApiResponse<DashboardAnalyticsResponseDto>>> GetDashboardAnalyticsAsync(
        [FromServices] IReservationService reservationService)
    {
        var analytics = await reservationService.GetDashboardAnalyticsAsync();
        return Ok(ApiResponse<DashboardAnalyticsResponseDto>.Ok(analytics, "Analytics retrieved."));
    }

    // Retrieves complete booking history for a specific prosumer
    [HttpGet("prosumers/{nic}/history")]
    public async Task<ActionResult<ApiResponse<IEnumerable<ReservationSummaryResponse>>>> GetProsumerHistoryAsync(
        string nic,
        [FromServices] IReservationService reservationService,
        [FromQuery] DateTime? fromUtc,
        [FromQuery] DateTime? toUtc,
        [FromQuery] ReservationStatus? status,
        [FromQuery] string? stationId)
    {
        var history = await reservationService.GetBookingHistoryAsync(nic, fromUtc, toUtc, status, stationId);
        return Ok(ApiResponse<IEnumerable<ReservationSummaryResponse>>.Ok(history, "History retrieved."));
    }
}
