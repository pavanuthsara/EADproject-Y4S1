// Energy booking (reservation) calls.
//
// Endpoints (ReservationsController):
//   GET    /api/reservations/history?fromUtc&toUtc&status&stationId
//   PUT    /api/reservations/{id}   -> UpdateReservationRequest
//   DELETE /api/reservations/{id}
//
// IMPORTANT: every route on this controller is [Authorize(Roles = Prosumer)] and reads
// the prosumer identity from the JWT claims. Backoffice and Grid Operator staff will
// get a 403 from all three functions until the controller's roles are widened or staff
// endpoints are added. That is an API gap, not a client-side one.
//
// Payloads are passed straight through; the API owns all validation, the 7-day
// booking window and the 12-hour notice rule.

import { apiRequest } from "./apiClient";

/**
 * Fetches booking history for the signed-in prosumer.
 * GET /api/reservations/history
 * @param {object} [filters] - all optional, passed as query params.
 *   { fromUtc, toUtc, status, stationId }
 *   `status` is the ReservationStatus enum name: "Pending", "Approved",
 *   "Rejected", "Completed" or "Cancelled".
 * @returns an array of ReservationSummaryResponse.
 */
export async function getBookings(filters = {}) {
    const { data } = await apiRequest("/reservations/history", {
        query: {
            fromUtc: filters.fromUtc,
            toUtc: filters.toUtc,
            status: filters.status,
            stationId: filters.stationId,
        },
    });
    return data ?? [];
}

/**
 * Updates the slot, direction or requested kWh of a booking.
 * PUT /api/reservations/{id}
 * @param {string} reservationId
 * @param {object} data - UpdateReservationRequest; provide at least one of
 *   { slotId, direction, requestedKwh }. `direction` is the EnergyDirection enum
 *   name: "Inject" or "Draw".
 * @returns the updated ReservationSummaryResponse, including the API's own
 *   canModify / canCancel flags and a rule-specific message.
 */
export async function updateBooking(reservationId, data) {
    const { data: updated } = await apiRequest(`/reservations/${encodeURIComponent(reservationId)}`, {
        method: "PUT",
        body: data,
    });
    return updated;
}

/**
 * Cancels a booking and releases its capacity.
 * DELETE /api/reservations/{id}
 * @param {string} reservationId
 * @returns the updated ReservationSummaryResponse.
 */
export async function cancelBooking(reservationId) {
    const { data: cancelled } = await apiRequest(`/reservations/${encodeURIComponent(reservationId)}`, {
        method: "DELETE",
    });
    return cancelled;
}