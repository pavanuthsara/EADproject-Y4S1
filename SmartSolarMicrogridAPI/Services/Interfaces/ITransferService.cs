/*
 * File: ITransferService.cs
 * Author: Damith Chandrathilaka (IT23168336)
 * Group: 45
 * Description: Interface for energy transfer verification and finalization service.
 * Individual Contribution: Defined the transfer service contract for QR verification and job completion.
 */

using SmartSolarMicrogridAPI.DTOs.Requests;
using SmartSolarMicrogridAPI.DTOs.Responses;

namespace SmartSolarMicrogridAPI.Services.Interfaces;

public interface ITransferService
{
    // Checks a scanned reservation QR token and returns the reservation it belongs to.
    Task<QrVerificationResponseDto> VerifyQrAsync(VerifyQrRequestDto dto);

    // Marks a verified energy transfer as completed by the operator.
    Task<TransferCompleteResponseDto> CompleteTransferAsync(string reservationId, string operatorId);
}
