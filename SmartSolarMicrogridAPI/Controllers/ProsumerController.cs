/*
 * File: ProsumerController.cs
 * Author: Pavan Uthsara (IT23158986)
 * Group: 45
 * Description: Endpoints for prosumer mobile app interactions.
 * Individual Contribution: Implemented self-registration endpoint for prosumers.
 */

using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogridAPI.Common.Responses;
using SmartSolarMicrogridAPI.DTOs.Requests;
using SmartSolarMicrogridAPI.DTOs.Responses;
using SmartSolarMicrogridAPI.Services.Interfaces;

namespace SmartSolarMicrogridAPI.Controllers;

[ApiController]
[Route("api/prosumer")]
public class ProsumerController(IAuthService authService) : ControllerBase
{
    // Mobile app: Prosumer self registration
    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> RegisterAsync([FromBody] RegisterRequestDto dto)
    {
        var result = await authService.RegisterAsync(dto);
        return Ok(ApiResponse<AuthResponseDto>.Ok(result, "Registration submitted successfully. Please wait for backoffice activation."));
    }
}
