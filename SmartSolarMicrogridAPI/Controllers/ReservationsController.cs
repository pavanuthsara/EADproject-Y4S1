/*
 * File: ReservationsController.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: HTTP endpoints for creating, updating and cancelling energy reservations.
 *              Handles routing and status codes only; every rule lives in the service.
 *
 * Individual Contribution: Implemented the create, update and cancel reservation
 *                          endpoints for signed-in prosumers.
 */

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using SmartSolarMicrogridAPI.Common.Constants;
using SmartSolarMicrogridAPI.Common.Enums;
using SmartSolarMicrogridAPI.Common.Responses;
using SmartSolarMicrogridAPI.Configuration;
using SmartSolarMicrogridAPI.DTOs.Requests;
using SmartSolarMicrogridAPI.DTOs.Responses;
using SmartSolarMicrogridAPI.Models.Entities;
using SmartSolarMicrogridAPI.Repositories.Interfaces;
using SmartSolarMicrogridAPI.Services.Interfaces;

namespace SmartSolarMicrogridAPI.Controllers;

[ApiController]
[Route("api/reservations")]
[Authorize]
public class ReservationsController(
    IReservationService reservationService,
    IMongoRepository<User> userRepository,
    IOptions<ReservationPolicyOptions> policyOptions) : ControllerBase
{
    private async Task<(string? id, string? nic)> GetTargetProsumerAsync(string? explicitNic)
    {
        string? role = User.FindFirstValue(ClaimTypes.Role);
        if (role == RoleConstants.Prosumer)
        {
            return (User.FindFirstValue(ClaimTypes.NameIdentifier), User.FindFirstValue(CustomClaimTypes.Nic));
        }
        
        if (string.IsNullOrEmpty(explicitNic)) return (null, null);
        
        var users = await userRepository.FindAsync(u => u.Nic == explicitNic && u.Role == RoleConstants.Prosumer);
        var user = users.FirstOrDefault();
        return (user?.Id, user?.Nic);
    }

    // Creates a reservation for the signed-in prosumer and returns 201 with its summary.
    [HttpPost]
    [Authorize(Roles = $"{RoleConstants.Prosumer},{RoleConstants.Backoffice},{RoleConstants.GridOperator}")]
    public async Task<ActionResult<ApiResponse<ReservationSummaryResponse>>> CreateAsync(
        [FromBody] CreateReservationRequest request)
    {
        var (prosumerId, prosumerNic) = await GetTargetProsumerAsync(request.ProsumerNic);
        if (string.IsNullOrEmpty(prosumerId) || string.IsNullOrEmpty(prosumerNic))
            return Unauthorized(ApiResponse<ReservationSummaryResponse>.Fail("Valid Prosumer NIC is required for staff, or missing claims for prosumer."));

        var summary = await reservationService.CreateAsync(request, prosumerId, prosumerNic);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<ReservationSummaryResponse>.Ok(summary, summary.Message));
    }

    // Updates the slot, direction or kWh of the reservation.
    [HttpPut("{id}")]
    [Authorize(Roles = $"{RoleConstants.Prosumer},{RoleConstants.Backoffice},{RoleConstants.GridOperator}")]
    public async Task<ActionResult<ApiResponse<ReservationSummaryResponse>>> UpdateAsync(
        string id, [FromBody] UpdateReservationRequest request)
    {
        var (prosumerId, prosumerNic) = await GetTargetProsumerAsync(request.ProsumerNic);
        if (string.IsNullOrEmpty(prosumerId))
            return Unauthorized(ApiResponse<ReservationSummaryResponse>.Fail("Valid Prosumer NIC is required for staff, or missing claims for prosumer."));

        var summary = await reservationService.UpdateAsync(id, request, prosumerId);
        return Ok(ApiResponse<ReservationSummaryResponse>.Ok(summary, summary.Message));
    }

    // Cancels the reservation and returns 200 with its summary.
    [HttpDelete("{id}")]
    [Authorize(Roles = $"{RoleConstants.Prosumer},{RoleConstants.Backoffice},{RoleConstants.GridOperator}")]
    public async Task<ActionResult<ApiResponse<ReservationSummaryResponse>>> CancelAsync(string id, [FromQuery] string? prosumerNic = null)
    {
        var (prosumerId, pNic) = await GetTargetProsumerAsync(prosumerNic);
        if (string.IsNullOrEmpty(prosumerId))
            return Unauthorized(ApiResponse<ReservationSummaryResponse>.Fail("Valid Prosumer NIC is required for staff, or missing claims for prosumer."));

        var summary = await reservationService.CancelAsync(id, prosumerId);
        return Ok(ApiResponse<ReservationSummaryResponse>.Ok(summary, summary.Message));
    }

    // Retrieves booking history for the signed-in prosumer or all if staff, with optional filters.
    [HttpGet("history")]
    [Authorize(Roles = $"{RoleConstants.Prosumer},{RoleConstants.Backoffice},{RoleConstants.GridOperator}")]
    public async Task<ActionResult<ApiResponse<IEnumerable<ReservationSummaryResponse>>>> GetHistoryAsync(
        [FromQuery] DateTime? fromUtc,
        [FromQuery] DateTime? toUtc,
        [FromQuery] ReservationStatus? status,
        [FromQuery] string? stationId,
        [FromQuery] string? prosumerNic) // Added for staff to filter by NIC
    {
        string? role = User.FindFirstValue(ClaimTypes.Role);
        string? nic = role == RoleConstants.Prosumer ? (User.FindFirstValue(CustomClaimTypes.Nic) ?? User.FindFirstValue("nic")) : prosumerNic;
        
        if (role == RoleConstants.Prosumer && string.IsNullOrEmpty(nic))
            return Unauthorized(ApiResponse<IEnumerable<ReservationSummaryResponse>>.Fail(ReservationMessages.MissingClaims));

        var history = await reservationService.GetBookingHistoryAsync(nic, fromUtc, toUtc, status, stationId);
        return Ok(ApiResponse<IEnumerable<ReservationSummaryResponse>>.Ok(history, "History retrieved."));
    }

    // Retrieves the current reservation policy configuration
    [HttpGet("policy")]
    [Authorize(Roles = $"{RoleConstants.Prosumer},{RoleConstants.Backoffice},{RoleConstants.GridOperator}")]
    public ActionResult<ApiResponse<ReservationPolicyOptions>> GetPolicy()
    {
        return Ok(ApiResponse<ReservationPolicyOptions>.Ok(policyOptions.Value, "Policy retrieved."));
    }
}
