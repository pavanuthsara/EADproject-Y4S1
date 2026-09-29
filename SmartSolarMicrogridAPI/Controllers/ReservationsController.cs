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
using SmartSolarMicrogridAPI.Common.Constants;
using SmartSolarMicrogridAPI.Common.Responses;
using SmartSolarMicrogridAPI.DTOs.Requests;
using SmartSolarMicrogridAPI.DTOs.Responses;
using SmartSolarMicrogridAPI.Services.Interfaces;

namespace SmartSolarMicrogridAPI.Controllers;

[ApiController]
[Route("api/reservations")]
[Authorize(Roles = RoleConstants.Prosumer)]
public class ReservationsController(IReservationService reservationService) : ControllerBase
{
    // Creates a reservation for the signed-in prosumer and returns 201 with its summary.
    [HttpPost]
    public async Task<ActionResult<ApiResponse<ReservationSummaryResponse>>> CreateAsync(
        [FromBody] CreateReservationRequest request)
    {
        string? prosumerId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        string? prosumerNic = User.FindFirstValue(CustomClaimTypes.Nic);
        if (string.IsNullOrEmpty(prosumerId) || string.IsNullOrEmpty(prosumerNic))
            return Unauthorized(ApiResponse<ReservationSummaryResponse>.Fail(ReservationMessages.MissingClaims));

        var summary = await reservationService.CreateAsync(request, prosumerId, prosumerNic);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<ReservationSummaryResponse>.Ok(summary, summary.Message));
    }

    // Updates the slot, direction or kWh of the signed-in prosumer's reservation.
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<ReservationSummaryResponse>>> UpdateAsync(
        string id, [FromBody] UpdateReservationRequest request)
    {
        string? prosumerId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(prosumerId))
            return Unauthorized(ApiResponse<ReservationSummaryResponse>.Fail(ReservationMessages.MissingClaims));

        var summary = await reservationService.UpdateAsync(id, request, prosumerId);
        return Ok(ApiResponse<ReservationSummaryResponse>.Ok(summary, summary.Message));
    }

    // Cancels the signed-in prosumer's reservation and returns 200 with its summary.
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<ReservationSummaryResponse>>> CancelAsync(string id)
    {
        string? prosumerId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(prosumerId))
            return Unauthorized(ApiResponse<ReservationSummaryResponse>.Fail(ReservationMessages.MissingClaims));

        var summary = await reservationService.CancelAsync(id, prosumerId);
        return Ok(ApiResponse<ReservationSummaryResponse>.Ok(summary, summary.Message));
    }
}
