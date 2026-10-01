// Microgrid node (solar station) management calls.
//
// "Nodes" in the UI are solar stations in the API. Endpoints (StationsController):
//   POST /api/stations                                  -> CreateStationRequestDto
//   PUT  /api/stations/{stationId}/deactivate
//   PUT  /api/stations/{stationId}/schedules/{slotId}   -> UpdateScheduleRequestDto
//   GET  /api/stations/nearby?lat&lng&radiusMeters      -> Prosumer only
//
// Payloads are passed straight through; the API owns all validation and rules.
// In particular the API blocks deactivation while active reservations exist, so no
// such check is duplicated here.

import { apiRequest } from "./apiClient";

/**
 * Lists microgrid nodes visible to the caller.
 * GET /api/stations
 * NOTE: no plain staff list endpoint exists yet. GET /api/stations/nearby is
 * Prosumer-only and needs coordinates, so it is exposed separately below.
 * This will 404 until a staff list route is added.
 */
export async function getNodes() {
    const { data } = await apiRequest("/stations");
    return data ?? [];
}

/**
 * Finds stations near a coordinate. Prosumer role only, used by the mobile map.
 * GET /api/stations/nearby
 * @param {{ lat: number, lng: number, radiusMeters?: number }} coords
 * @returns an array of StationResponseDto.
 */
export async function getNearbyNodes({ lat, lng, radiusMeters }) {
    const { data } = await apiRequest("/stations/nearby", {
        query: { lat, lng, radiusMeters },
    });
    return data ?? [];
}

/**
 * Registers a new microgrid node / solar station.
 * POST /api/stations  (Backoffice role)
 * @param {object} data - CreateStationRequestDto
 *   { stationName, stationCode, latitude, longitude, addressLine, city,
 *     capacityKwh, totalBays }
 * @returns the created StationResponseDto.
 */
export async function createNode(data) {
    const { data: created } = await apiRequest("/stations", {
        method: "POST",
        body: data,
    });
    return created;
}

/**
 * Replaces a station slot's schedule. This is a full replacement, so the API marks
 * every field required.
 * PUT /api/stations/{stationId}/schedules/{slotId}
 * @param {string} stationId - Owning station.
 * @param {string} slotId - Booking slot to update.
 * @param {object} newSchedule - UpdateScheduleRequestDto
 *   { startTime, endTime, totalPositions, status }
 *   `status` is the SlotStatus enum name: "Available", "Full" or "Closed".
 *   Only Available or Closed can be requested; Full is derived server-side.
 * @returns the updated ScheduleResponseDto.
 * @param {string} [operatorId] - unused; the API reads the operator from the JWT.
 */
export async function updateNodeSchedule(stationId, slotId, newSchedule) {
    const { data: updated } = await apiRequest(
        `/stations/${encodeURIComponent(stationId)}/schedules/${encodeURIComponent(slotId)}`,
        { method: "PUT", body: newSchedule }
    );
    return updated;
}

/**
 * Deactivates a station. The API rejects this while active energy reservations
 * exist, and that message is passed back to the caller unchanged.
 * PUT /api/stations/{stationId}/deactivate  (Backoffice role)
 * @param {string} stationId
 * @returns the updated StationResponseDto.
 */
export async function deactivateNode(stationId) {
    const { data: updated } = await apiRequest(`/stations/${encodeURIComponent(stationId)}/deactivate`, {
        method: "PUT",
    });
    return updated;
}

/**
 * Reactivates a previously deactivated station.
 * NOTE: the API has no activate route -- DeactivateStationAsync only moves a
 * station to Inactive. This will 404 until the endpoint is added.
 * PUT /api/stations/{stationId}/activate
 */
export async function activateNode(stationId) {
    const { data: updated } = await apiRequest(`/stations/${encodeURIComponent(stationId)}/activate`, {
        method: "PUT",
    });
    return updated;
}