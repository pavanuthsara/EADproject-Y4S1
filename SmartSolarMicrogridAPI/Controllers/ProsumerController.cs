/*
 * File: ProsumerController.cs
 * Author: Pavan Uthsara (IT23158986)
 * Group: 45
 * Description: Endpoints for prosumer mobile app interactions.
 * Individual Contribution: Implemented self-registration endpoint for prosumers.
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
[Route("api/prosumer")]
public class ProsumerController(IAuthService authService, IUserService userService) : ControllerBase
{
    // Mobile app: Prosumer self registration
    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> RegisterAsync([FromBody] RegisterRequestDto dto)
    {
        var result = await authService.RegisterAsync(dto);
        return Ok(ApiResponse<AuthResponseDto>.Ok(result, "Registration submitted successfully. Please wait for backoffice activation."));
    }

    // Allows prosumers to edit their own profile data
    [HttpPut("profile")]
    [Authorize(Roles = RoleConstants.Prosumer)]
    public async Task<ActionResult<ApiResponse<UserResponseDto>>> UpdateProfileAsync([FromBody] UpdateProfileRequestDto dto)
    {
        string? nic = User.FindFirstValue("nic");
        if (string.IsNullOrEmpty(nic)) return Unauthorized(ApiResponse<UserResponseDto>.Fail("NIC claim missing in token."));

        var result = await userService.UpdateProsumerProfileAsync(nic, dto);
        return Ok(ApiResponse<UserResponseDto>.Ok(result, "Profile updated successfully."));
    }
}
