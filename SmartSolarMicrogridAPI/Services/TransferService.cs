/*
 * File: TransferService.cs
 * Author: Damith Chandrathilaka (IT23168336)
 * Group: 45
 * Description: Implementation of energy transfer QR verification and finalization business logic.
 * Individual Contribution: Implemented QR code cross-referencing and transfer job completion logic.
 */

using SmartSolarMicrogridAPI.Common.Enums;
using SmartSolarMicrogridAPI.Common.Exceptions;
using SmartSolarMicrogridAPI.DTOs.Requests;
using SmartSolarMicrogridAPI.DTOs.Responses;
using SmartSolarMicrogridAPI.Models.Entities;
using SmartSolarMicrogridAPI.Repositories.Interfaces;
using SmartSolarMicrogridAPI.Services.Interfaces;

namespace SmartSolarMicrogridAPI.Services;

public class TransferService(IMongoRepository<EnergyReservation> reservationRepository) : ITransferService
{
    // Cross-references the scanned QR token against server reservation records and validates its status.
    public async Task<QrVerificationResponseDto> VerifyQrAsync(VerifyQrRequestDto dto)
    {
        var reservations = await reservationRepository.FindAsync(r => r.QrToken == dto.QrToken);
        var reservation = reservations.FirstOrDefault();

        if (reservation == null)
        {
            throw new NotFoundException("No reservation found matching this QR code.");
        }

        if (reservation.Status != ReservationStatus.Approved.ToString())
        {
            throw new BusinessRuleException($"Reservation cannot be verified because its status is '{reservation.Status}'. Only approved reservations can be processed.");
        }

        return new QrVerificationResponseDto
        {
            ReservationId = reservation.Id,
            ReservationNo = reservation.ReservationNo,
            ProsumerId = reservation.ProsumerId,
            ProsumerNic = reservation.ProsumerNic,
            StationId = reservation.StationId,
            SlotId = reservation.SlotId,
            SlotStartTime = reservation.SlotStartUtc,
            Direction = reservation.Direction,
            RequestedKwh = reservation.RequestedKwh,
            Status = reservation.Status,
            QrToken = reservation.QrToken,
            ApprovedAt = reservation.ApprovedAtUtc
        };
    }

    // Finalizes the energy transfer job by validating the reservation state and updating it to Completed.
    public async Task<TransferCompleteResponseDto> CompleteTransferAsync(string reservationId, string operatorId)
    {
        var reservation = await reservationRepository.GetByIdAsync(reservationId);

        if (reservation == null)
        {
            throw new NotFoundException($"Reservation with ID '{reservationId}' was not found.");
        }

        if (reservation.Status != ReservationStatus.Approved.ToString())
        {
            throw new BusinessRuleException($"Cannot complete reservation: current status is '{reservation.Status}'. Only approved reservations can be completed.");
        }

        var completedTime = DateTime.UtcNow;
        reservation.Status = ReservationStatus.Completed.ToString();
        reservation.CompletedBy = operatorId;
        reservation.CompletedAtUtc = completedTime;
        reservation.UpdatedAtUtc = completedTime;

        var updated = await reservationRepository.UpdateAsync(reservationId, reservation);
        if (!updated)
        {
            throw new BusinessRuleException("Failed to update reservation status in the database.");
        }

        return new TransferCompleteResponseDto
        {
            ReservationId = reservation.Id,
            ReservationNo = reservation.ReservationNo,
            Status = reservation.Status,
            CompletedBy = operatorId,
            CompletedAt = completedTime
        };
    }
}
