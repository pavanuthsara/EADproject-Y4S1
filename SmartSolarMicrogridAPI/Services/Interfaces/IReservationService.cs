/*
 * File: IReservationService.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: Contract for creating, updating and cancelling energy reservations.
 *
 * Individual Contribution: Defined the reservation service contract used by the
 *                          reservations controller.
 */

using SmartSolarMicrogridAPI.Common.Enums;
using SmartSolarMicrogridAPI.DTOs.Requests;
using SmartSolarMicrogridAPI.DTOs.Responses;

namespace SmartSolarMicrogridAPI.Services.Interfaces;

public interface IReservationService
{
    Task<ReservationSummaryResponse> CreateAsync(CreateReservationRequest request, string prosumerId, string prosumerNic);

    Task<ReservationSummaryResponse> UpdateAsync(string reservationId, UpdateReservationRequest request, string prosumerId);

    Task<ReservationSummaryResponse> CancelAsync(string reservationId, string prosumerId);

    Task<DashboardAnalyticsResponseDto> GetDashboardAnalyticsAsync();

    Task<IEnumerable<ReservationSummaryResponse>> GetBookingHistoryAsync(
        string? nic, DateTime? fromUtc, DateTime? toUtc, ReservationStatus? status, string? stationId);
}
