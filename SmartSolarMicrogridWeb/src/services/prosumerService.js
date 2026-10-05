// Prosumer management calls for the Backoffice dashboard.
//
// Endpoints (BackofficeController, all [Authorize(Roles = Backoffice)]):
//   POST /api/backoffice/prosumers              -> CreateProsumerRequestDto
//   PUT  /api/backoffice/prosumers/{nic}         -> UpdateProfileRequestDto
//   PUT  /api/backoffice/prosumers/{nic}/activate
//   PUT  /api/backoffice/prosumers/{nic}/deactivate
//
// Payloads are passed straight through; the API owns all validation and rules.

import { apiRequest } from "./apiClient";

/**
 * Fetches every prosumer registered through backoffice or the mobile app.
 * GET /api/backoffice/prosumers
 * NOTE: this endpoint does not exist yet on the API, so this will 404 until
 * a list route is added. Callers should handle the rejection.
 */
export async function getProsumers() {
    const { data } = await apiRequest("/backoffice/prosumers");
    return data ?? [];
}

/**
 * Registers a new prosumer and activates it immediately.
 * POST /api/backoffice/prosumers
 * @param {object} data - CreateProsumerRequestDto
 *   { nic, fullName, email, phone, password, address, solarCapacityKw }
 * @returns the created UserResponseDto.
 */
export async function createProsumer(data) {
    const { data: created } = await apiRequest("/backoffice/prosumers", {
        method: "POST",
        body: data,
    });
    return created;
}

/**
 * Updates a prosumer's profile fields.
 * PUT /api/backoffice/prosumers/{nic}
 * @param {string} nic - National Identity Card number, the lookup key.
 * @param {object} data - UpdateProfileRequestDto
 *   { fullName, email, phone, address, solarCapacityKw }
 * @returns the updated UserResponseDto.
 */
export async function updateProsumer(nic, data) {
    const { data: updated } = await apiRequest(`/backoffice/prosumers/${encodeURIComponent(nic)}`, {
        method: "PUT",
        body: data,
    });
    return updated;
}

/**
 * Activates or deactivates a prosumer account.
 *
 * The API exposes these as two separate routes rather than a status field, so this
 * dispatches on `isActive`. `Pending` registrations are moved to Active by the
 * activate route.
 *
 * @param {string} nic - National Identity Card number.
 * @param {boolean|string} isActive - true to activate, false to deactivate.
 * @returns the updated UserResponseDto.
 */
export async function toggleProsumerStatus(nic, isActive) {
    const action = isActive === true || isActive === "Active" ? "activate" : "deactivate";
    const { data: updated } = await apiRequest(
        `/backoffice/prosumers/${encodeURIComponent(nic)}/${action}`,
        { method: "PUT" }
    );
    return updated;
}

/**
 * Activates a pending prosumer registration.
 * PUT /api/backoffice/prosumers/{nic}/activate
 */
export async function activateProsumer(nic) {
    const { data } = await apiRequest(`/backoffice/prosumers/${encodeURIComponent(nic)}/activate`, {
        method: "PUT",
    });
    return data;
}

/**
 * Deactivates a prosumer account.
 * PUT /api/backoffice/prosumers/{nic}/deactivate
 */
export async function deactivateProsumer(nic) {
    const { data } = await apiRequest(`/backoffice/prosumers/${encodeURIComponent(nic)}/deactivate`, {
        method: "PUT",
    });
    return data;
}

/**
 * Retrieves dashboard analytics counts for reservations.
 * GET /api/backoffice/dashboard/analytics
 */
export async function getDashboardAnalytics() {
    const { data } = await apiRequest("/backoffice/dashboard/analytics");
    return data;
}