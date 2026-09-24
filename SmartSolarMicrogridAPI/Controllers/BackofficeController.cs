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
}
