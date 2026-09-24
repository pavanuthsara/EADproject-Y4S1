/*
 * File: UserController.cs
 * Author: Pavan Uthsara (IT23158986)
 * Group: 45
 * Description: Controller for user management endpoints.
 * Individual Contribution: Implemented the API endpoint for staff creation with role-based authorization.
 */

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogridAPI.Common.Constants;
using SmartSolarMicrogridAPI.Common.Responses;
using SmartSolarMicrogridAPI.DTOs.Requests;
using SmartSolarMicrogridAPI.DTOs.Responses;
using SmartSolarMicrogridAPI.Services.Interfaces;

namespace SmartSolarMicrogridAPI.Controllers;

[ApiController]
[Route("api/users")]
public class UserController(IUserService userService) : ControllerBase
{
    // Allows Backoffice to create web application users with Backoffice or Grid Operator roles.
    [HttpPost("staff")]
    [Authorize(Roles = RoleConstants.Backoffice)]
    public async Task<ActionResult<ApiResponse<UserResponseDto>>> CreateStaffAsync([FromBody] CreateStaffRequestDto dto)
    {
        var result = await userService.CreateStaffAsync(dto);
        return Ok(ApiResponse<UserResponseDto>.Ok(result, "Staff user created successfully."));
    }
}
