import { apiRequest } from './apiClient';

/**
 * Retrieves booking history for the signed-in prosumer or all if staff, with optional filters.
 * GET /api/reservations/history
 */
export async function getReservations(filters = {}) {
    const { fromUtc, toUtc, status, stationId, prosumerNic } = filters;
    const { data } = await apiRequest('/reservations/history', {
        query: { fromUtc, toUtc, status, stationId, prosumerNic },
    });
    return data ?? [];
}

/**
 * Retrieves all stations for staff.
 * GET /api/stations
 */
export async function getStations() {
    const { data } = await apiRequest('/stations');
    return data ?? [];
}

/**
 * Retrieves all booking slots for a given station.
 * GET /api/stations/{stationId}/slots
 */
export async function getSlots(stationId) {
    if (!stationId) return [];
    const { data } = await apiRequest(`/stations/${encodeURIComponent(stationId)}/slots`);
    return data ?? [];
}

/**
 * Retrieves the reservation policy configuration.
 * GET /api/reservations/policy
 */
export async function getReservationPolicy() {
    const { data } = await apiRequest('/reservations/policy');
    return data ?? { bookingWindowDays: 7, minimumNoticeHours: 12 };
}

/**
 * Creates a new reservation.
 * POST /api/reservations
 */
export async function createReservation(reservationData) {
    const { data } = await apiRequest('/reservations', {
        method: 'POST',
        body: reservationData,
    });
    return data;
}

/**
 * Updates an existing reservation.
 * PUT /api/reservations/{reservationId}
 */
export async function updateReservation(reservationId, updateData) {
    const { data } = await apiRequest(`/reservations/${encodeURIComponent(reservationId)}`, {
        method: 'PUT',
        body: updateData,
    });
    return data;
}

/**
 * Cancels a reservation.
 * DELETE /api/reservations/{reservationId}
 */
export async function cancelReservation(reservationId, prosumerNic) {
    const { data } = await apiRequest(`/reservations/${encodeURIComponent(reservationId)}`, {
        method: 'DELETE',
        query: prosumerNic ? { prosumerNic } : undefined,
    });
    return data;
}
