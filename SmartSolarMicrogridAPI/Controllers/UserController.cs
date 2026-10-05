/*
 * File: UserController.cs
 * Author: Pavan Uthsara (IT23158986)
 * Group: 42
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

    // Retrieves all Backoffice and Grid Operator accounts.
    [HttpGet("staff")]
    [Authorize(Roles = RoleConstants.Backoffice)]
    public async Task<ActionResult<ApiResponse<IEnumerable<UserResponseDto>>>> GetAllStaffAsync()
    {
        var result = await userService.GetAllStaffAsync();
        return Ok(ApiResponse<IEnumerable<UserResponseDto>>.Ok(result, "Staff list retrieved successfully."));
    }

    // Updates a staff member's profile details.
    [HttpPut("staff/{id}")]
    [Authorize(Roles = RoleConstants.Backoffice)]
    public async Task<ActionResult<ApiResponse<UserResponseDto>>> UpdateStaffAsync(string id, [FromBody] UpdateStaffRequestDto dto)
    {
        var result = await userService.UpdateStaffProfileAsync(id, dto);
        return Ok(ApiResponse<UserResponseDto>.Ok(result, "Staff updated successfully."));
    }

    [HttpPatch("staff/{id}/status")]
    [Authorize(Roles = RoleConstants.Backoffice)]
    public async Task<ActionResult<ApiResponse<UserResponseDto>>> UpdateStaffStatusAsync(string id, [FromBody] UpdateUserStatusRequestDto dto)
    {
        // Typically updatedBy would come from User.Claims (e.g. JWT)
        // For simplicity, passing "System" or you could extract from context: User.Identity.Name
        string updatedBy = User.Identity?.Name ?? "Admin";
        var result = await userService.UpdateStaffStatusAsync(id, dto.Status, updatedBy);
        return Ok(ApiResponse<UserResponseDto>.Ok(result, "Staff status updated successfully."));
    }
}
