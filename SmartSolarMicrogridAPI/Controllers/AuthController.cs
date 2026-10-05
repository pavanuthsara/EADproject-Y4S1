/*
 * File: AuthController.cs
 * Author: Damith Chandrathilaka (IT23168336)
 * Group: 42
 * Description: Exposes register and login endpoints.
 * Individual Contribution: Implemented the authentication API endpoints.
 */

using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogridAPI.Common.Responses;
using SmartSolarMicrogridAPI.DTOs.Requests;
using SmartSolarMicrogridAPI.DTOs.Responses;
using SmartSolarMicrogridAPI.Services.Interfaces;

namespace SmartSolarMicrogridAPI.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    // Registers a new user and returns a JWT token.
    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> RegisterAsync([FromBody] RegisterRequestDto dto)
    {
        var result = await authService.RegisterAsync(dto);
        return Ok(ApiResponse<AuthResponseDto>.Ok(result, "Registration successful."));
    }

    // Authenticates a user and returns a JWT token.
    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> LoginAsync([FromBody] LoginRequestDto dto)
    {
        var result = await authService.LoginAsync(dto);
        return Ok(ApiResponse<AuthResponseDto>.Ok(result, "Login successful."));
    }
}
