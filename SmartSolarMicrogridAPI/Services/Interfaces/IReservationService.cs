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
    // Books a slot for a prosumer, subject to the booking rules.
    Task<ReservationSummaryResponse> CreateAsync(CreateReservationRequest request, string prosumerId, string prosumerNic);

    // Changes a reservation's slot, direction or energy amount, subject to the booking rules.
    Task<ReservationSummaryResponse> UpdateAsync(string reservationId, UpdateReservationRequest request, string prosumerId);

    // Cancels a reservation, subject to the notice rule.
    Task<ReservationSummaryResponse> CancelAsync(string reservationId, string prosumerId);

    // Staff decision: moves a Pending reservation to Approved.
    Task<ReservationSummaryResponse> ApproveAsync(string reservationId, string staffUserId);

    // Staff decision: rejects a Pending or Approved reservation and releases its capacity.
    Task<ReservationSummaryResponse> RejectAsync(string reservationId, string staffUserId, string reason);

    // Counts reservations by state for the staff dashboard.
    Task<DashboardAnalyticsResponseDto> GetDashboardAnalyticsAsync();

    Task<IEnumerable<ReservationSummaryResponse>> GetBookingHistoryAsync(
        string? nic, DateTime? fromUtc, DateTime? toUtc, ReservationStatus? status, string? stationId, string? slotId = null,
        bool includeQrToken = false);
}
