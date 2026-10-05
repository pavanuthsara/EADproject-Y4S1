/*
 * File: StationsController.cs
 * Author: Ransilu Samaraweera
 * Group: 42
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
public class StationsController(IStationService stationService, ISlotService slotService) : ControllerBase
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

    // Creates a booking slot inside a station (Backoffice).
    [HttpPost("{stationId}/slots")]
    [Authorize(Roles = RoleConstants.Backoffice)]
    public async Task<ActionResult<ApiResponse<ScheduleResponseDto>>> CreateSlotAsync(
        string stationId, [FromBody] SlotRequestDto dto)
    {
        var result = await slotService.CreateSlotAsync(stationId, dto);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<ScheduleResponseDto>.Ok(result, SlotMessages.Created));
    }

    // Replaces the details of a slot (Backoffice).
    [HttpPut("{stationId}/slots/{slotId}")]
    [Authorize(Roles = RoleConstants.Backoffice)]
    public async Task<ActionResult<ApiResponse<ScheduleResponseDto>>> UpdateSlotAsync(
        string stationId, string slotId, [FromBody] SlotRequestDto dto)
    {
        var result = await slotService.UpdateSlotAsync(stationId, slotId, dto);
        return Ok(ApiResponse<ScheduleResponseDto>.Ok(result, SlotMessages.Updated));
    }

    // Deletes a slot that has no active reservations (Backoffice).
    [HttpDelete("{stationId}/slots/{slotId}")]
    [Authorize(Roles = RoleConstants.Backoffice)]
    public async Task<ActionResult<ApiResponse<object>>> DeleteSlotAsync(string stationId, string slotId)
    {
        await slotService.DeleteSlotAsync(stationId, slotId);
        return Ok(ApiResponse<object>.Ok(null, SlotMessages.Deleted));
    }

    // Opens or closes a slot to new bookings (Backoffice and Grid Operator).
    [HttpPatch("{stationId}/slots/{slotId}/availability")]
    [Authorize(Roles = $"{RoleConstants.Backoffice},{RoleConstants.GridOperator}")]
    public async Task<ActionResult<ApiResponse<ScheduleResponseDto>>> SetSlotAvailabilityAsync(
        string stationId, string slotId, [FromBody] SlotAvailabilityRequestDto dto)
    {
        bool open = dto.Open!.Value;
        var result = await slotService.SetAvailabilityAsync(stationId, slotId, open);
        return Ok(ApiResponse<ScheduleResponseDto>.Ok(result, open ? SlotMessages.Opened : SlotMessages.Closed));
    }

    // Lets Grid Operators and Backoffice staff change a station's daily operating hours.
    [HttpPut("{stationId}/operating-schedule")]
    [Authorize(Roles = $"{RoleConstants.Backoffice},{RoleConstants.GridOperator}")]
    public async Task<ActionResult<ApiResponse<StationResponseDto>>> UpdateOperatingScheduleAsync(
        string stationId, [FromBody] UpdateOperatingScheduleRequestDto dto)
    {
        var result = await stationService.UpdateOperatingScheduleAsync(stationId, dto);
        return Ok(ApiResponse<StationResponseDto>.Ok(result, "Operating schedule updated successfully."));
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

    // Activates a station.
    [HttpPut("{stationId}/activate")]
    [Authorize(Roles = RoleConstants.Backoffice)]
    public async Task<ActionResult<ApiResponse<StationResponseDto>>> ActivateStationAsync(string stationId)
    {
        var result = await stationService.ActivateStationAsync(stationId);
        return Ok(ApiResponse<StationResponseDto>.Ok(result, "Station activated successfully."));
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

    // Retrieves all stations for staff.
    [HttpGet]
    [Authorize(Roles = $"{RoleConstants.Backoffice},{RoleConstants.GridOperator}")]
    public async Task<ActionResult<ApiResponse<IEnumerable<StationResponseDto>>>> GetAllStationsAsync()
    {
        var result = await stationService.GetAllStationsAsync();
        return Ok(ApiResponse<IEnumerable<StationResponseDto>>.Ok(result, "Stations retrieved."));
    }

    // Retrieves a station's booking slots: every slot for staff, only bookable slots for prosumers.
    [HttpGet("{stationId}/slots")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IEnumerable<ScheduleResponseDto>>>> GetStationSlotsAsync(string stationId)
    {
        bool isStaff = User.IsInRole(RoleConstants.Backoffice) || User.IsInRole(RoleConstants.GridOperator);
        var result = await slotService.GetSlotsAsync(stationId, isStaff);
        return Ok(ApiResponse<IEnumerable<ScheduleResponseDto>>.Ok(result, "Station slots retrieved."));
    }
}
