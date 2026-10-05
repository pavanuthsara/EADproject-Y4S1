/*
 * File: TransferController.cs
 * Author: Damith Chandrathilaka (IT23168336)
 * Group: 42
 * Description: Endpoints for QR code verification and energy transfer finalization.
 * Individual Contribution: Implemented the transfer verification and completion endpoints with role authorization.
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
[Route("api/transfers")]
[Authorize(Roles = $"{RoleConstants.GridOperator},{RoleConstants.Backoffice}")]
public class TransferController(ITransferService transferService) : ControllerBase
{
    // Verifies scanned QR token against server reservation records and returns booking details.
    [HttpPost("verify")]
    public async Task<ActionResult<ApiResponse<QrVerificationResponseDto>>> VerifyQrAsync([FromBody] VerifyQrRequestDto dto)
    {
        var result = await transferService.VerifyQrAsync(dto);
        return Ok(ApiResponse<QrVerificationResponseDto>.Ok(result, "QR code verified successfully."));
    }

    // Completes the energy transfer job and records completion details in the database.
    [HttpPost("{reservationId}/complete")]
    public async Task<ActionResult<ApiResponse<TransferCompleteResponseDto>>> CompleteTransferAsync(string reservationId)
    {
        string? operatorId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(operatorId))
        {
            return Unauthorized();
        }

        var result = await transferService.CompleteTransferAsync(reservationId, operatorId);
        return Ok(ApiResponse<TransferCompleteResponseDto>.Ok(result, "Energy transfer completed successfully."));
    }
}
