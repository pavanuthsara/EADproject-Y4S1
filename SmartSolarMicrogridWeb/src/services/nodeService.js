// Microgrid node (solar station) management calls.
//
// "Nodes" in the UI are solar stations in the API. Endpoints (StationsController):
//   GET  /api/stations                                  -> Backoffice, GridOperator
//   POST /api/stations                                  -> CreateStationRequestDto (Backoffice)
//   PUT  /api/stations/{stationId}/operating-schedule   -> UpdateOperatingScheduleRequestDto
//   PUT  /api/stations/{stationId}/schedules/{slotId}   -> UpdateScheduleRequestDto
//   PUT  /api/stations/{stationId}/deactivate           -> Backoffice
//   PUT  /api/stations/{stationId}/activate             -> Backoffice
//   GET  /api/stations/nearby?lat&lng&radiusMeters      -> Prosumer only
//
// Payloads are passed straight through; the API owns all validation and rules.
// In particular the API blocks deactivation while active reservations exist, so no
// such check is duplicated here.

import { apiRequest } from "./apiClient";

/**
 * Lists every microgrid node for staff.
 * GET /api/stations  (Backoffice or GridOperator role)
 * @returns an array of StationResponseDto.
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
 *     capacityKwh, totalBays, operatingSchedule }
 *   `operatingSchedule` is the daily window as 24h "HH:mm-HH:mm".
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
 * Changes a station's daily operating hours.
 * PUT /api/stations/{stationId}/operating-schedule  (Backoffice or GridOperator role)
 * @param {string} stationId
 * @param {string} operatingSchedule - 24h "HH:mm-HH:mm", e.g. "06:00-18:00".
 * @returns the updated StationResponseDto.
 */
export async function updateNodeOperatingSchedule(stationId, operatingSchedule) {
    const { data: updated } = await apiRequest(
        `/stations/${encodeURIComponent(stationId)}/operating-schedule`,
        { method: "PUT", body: { operatingSchedule } }
    );
    return updated;
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
 * PUT /api/stations/{stationId}/activate  (Backoffice role)
 * @returns the updated StationResponseDto.
 */
export async function activateNode(stationId) {
    const { data: updated } = await apiRequest(`/stations/${encodeURIComponent(stationId)}/activate`, {
        method: "PUT",
    });
    return updated;
}