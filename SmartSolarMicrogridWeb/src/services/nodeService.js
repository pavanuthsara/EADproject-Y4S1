// Microgrid node (solar station) management calls.
//
// "Nodes" in the UI are solar stations in the API. Endpoints (StationsController):
//   GET  /api/stations                                  -> Backoffice, GridOperator
//   POST /api/stations                                  -> CreateStationRequestDto (Backoffice)
//   PUT  /api/stations/{stationId}/operating-schedule   -> UpdateOperatingScheduleRequestDto
//   GET    /api/stations/{stationId}/slots                       -> any signed-in role (staff see every slot)
//   POST   /api/stations/{stationId}/slots                       -> SlotRequestDto (Backoffice)
//   PUT    /api/stations/{stationId}/slots/{slotId}              -> SlotRequestDto (Backoffice)
//   DELETE /api/stations/{stationId}/slots/{slotId}              -> Backoffice
//   PATCH  /api/stations/{stationId}/slots/{slotId}/availability -> Backoffice, GridOperator
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
 * Lists every booking slot of a node, earliest first. Staff receive all slots.
 * GET /api/stations/{stationId}/slots
 * @returns an array of ScheduleResponseDto.
 */
export async function getNodeSlots(stationId) {
    const { data } = await apiRequest(`/stations/${encodeURIComponent(stationId)}/slots`);
    return data ?? [];
}

/**
 * Adds a booking slot inside a node. The node is the battery, so the API checks that
 * the slot fits inside the node's bays and capacity.
 * POST /api/stations/{stationId}/slots  (Backoffice role)
 * @param {string} stationId
 * @param {object} slot - SlotRequestDto
 *   { startTime, endTime, totalPositions, capacityKwh, supportedDirections }
 *   Times are UTC ISO strings; `supportedDirections` holds "Inject" and/or "Draw".
 * @returns the created ScheduleResponseDto.
 */
export async function createSlot(stationId, slot) {
    const { data: created } = await apiRequest(`/stations/${encodeURIComponent(stationId)}/slots`, {
        method: "POST",
        body: slot,
    });
    return created;
}

/**
 * Replaces every detail of a slot (same body as createSlot).
 * PUT /api/stations/{stationId}/slots/{slotId}  (Backoffice role)
 * @returns the updated ScheduleResponseDto.
 */
export async function updateSlot(stationId, slotId, slot) {
    const { data: updated } = await apiRequest(
        `/stations/${encodeURIComponent(stationId)}/slots/${encodeURIComponent(slotId)}`,
        { method: "PUT", body: slot }
    );
    return updated;
}

/**
 * Deletes a slot. The API refuses while the slot has Pending or Approved reservations.
 * DELETE /api/stations/{stationId}/slots/{slotId}  (Backoffice role)
 */
export async function deleteSlot(stationId, slotId) {
    await apiRequest(
        `/stations/${encodeURIComponent(stationId)}/slots/${encodeURIComponent(slotId)}`,
        { method: "DELETE" }
    );
}

/**
 * Opens or closes a slot to new bookings. Existing bookings are not affected.
 * PATCH /api/stations/{stationId}/slots/{slotId}/availability  (Backoffice or GridOperator role)
 * @param {boolean} open - true to accept bookings, false to close the slot.
 * @returns the updated ScheduleResponseDto.
 */
export async function setSlotAvailability(stationId, slotId, open) {
    const { data: updated } = await apiRequest(
        `/stations/${encodeURIComponent(stationId)}/slots/${encodeURIComponent(slotId)}/availability`,
        { method: "PATCH", body: { open } }
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