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

// The API describes a prosumer with `fullName` and `accountStatus` ("Pending", "Active" or
// "Deactivated"). The prosumer screen is written around `name` and `status` ("Pending",
// "Active" or "Inactive"), so every response is converted here, in one place. The original
// API fields are kept as well.
const STATUS_LABELS = { Pending: "Pending", Active: "Active", Deactivated: "Inactive" };

function toScreenProsumer(user) {
    return {
        ...user,
        name: user.fullName,
        status: STATUS_LABELS[user.accountStatus] ?? user.accountStatus,
    };
}

// The screen's form calls the name field `name`; the API expects `fullName`.
function toApiProfile({ name, ...rest }) {
    return { fullName: name, ...rest };
}

/**
 * Fetches every prosumer registered through backoffice or the mobile app.
 * GET /api/backoffice/prosumers
 * Each prosumer also carries `name` and `status` for the screen (see above).
 */
export async function getProsumers() {
    const { data } = await apiRequest("/backoffice/prosumers");
    return (data ?? []).map(toScreenProsumer);
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
        body: toApiProfile(data),
    });
    return toScreenProsumer(created);
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
        body: toApiProfile(data),
    });
    return toScreenProsumer(updated);
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
    return toScreenProsumer(updated);
}

/**
 * Activates a pending prosumer registration.
 * PUT /api/backoffice/prosumers/{nic}/activate
 */
export async function activateProsumer(nic) {
    const { data } = await apiRequest(`/backoffice/prosumers/${encodeURIComponent(nic)}/activate`, {
        method: "PUT",
    });
    return toScreenProsumer(data);
}

/**
 * Deactivates a prosumer account.
 * PUT /api/backoffice/prosumers/{nic}/deactivate
 */
export async function deactivateProsumer(nic) {
    const { data } = await apiRequest(`/backoffice/prosumers/${encodeURIComponent(nic)}/deactivate`, {
        method: "PUT",
    });
    return toScreenProsumer(data);
}

/**
 * Retrieves dashboard analytics counts for reservations.
 * GET /api/backoffice/dashboard/analytics
 */
export async function getDashboardAnalytics() {
    const { data } = await apiRequest("/backoffice/dashboard/analytics");
    return data;
}