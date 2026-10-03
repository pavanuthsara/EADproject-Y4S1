// Shared HTTP client for the SmartSolarMicrogridAPI.
//
// Thin transport layer only: attaches the stored JWT to every request, unwraps the
// ApiResponse<T> envelope and turns non-2xx responses into thrown Errors carrying the
// server's own message. No business rules live here or in the services that use it --
// the API is the single authority for validation.

import { getToken } from "./authService";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5014/api";

// Reads the ApiResponse<T> envelope the API returns on every endpoint.
// Mirrors Common/Responses/ApiResponse.cs: { success, message, data }.
async function readEnvelope(response) {
    const text = await response.text();
    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch {
        // Non-JSON body (proxy error page, empty 401, etc).
        return null;
    }
}

// ASP.NET model validation failures come back as ProblemDetails
// ({ title, errors: { Field: ["message"] } }) rather than the envelope.
function firstValidationError(body) {
    return Object.values(body?.errors ?? {}).flat()[0];
}

// Requests that fail because the token is missing, expired or rejected.
function isAuthFailure(response) {
    return response.status === 401 || response.status === 403;
}

// Performs a request against the API with the JWT bearer token attached and returns
// the unwrapped `data` payload. Rejects with the server-provided message on failure.
export async function apiRequest(path, { method = "GET", body, query } = {}) {
    const headers = { Accept: "application/json" };

    if (body !== undefined) {
        headers["Content-Type"] = "application/json";
    }

    const token = getToken();
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    let url = `${API_BASE}${path}`;

    if (query) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined && value !== null && value !== "") {
                params.append(key, String(value));
            }
        }
        const qs = params.toString();
        if (qs) url += `?${qs}`;
    }

    let response;
    try {
        response = await fetch(url, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
        });
    } catch {
        throw new Error("Could not reach the server. Please try again.");
    }

    const envelope = await readEnvelope(response);

    if (!response.ok || envelope?.success === false) {
        // The middleware writes the same envelope shape for unhandled exceptions.
        const message =
            envelope?.message ||
            firstValidationError(envelope) ||
            (isAuthFailure(response)
                ? "Your session has expired. Please log in again."
                : `Request failed with status ${response.status}.`);

        throw new Error(message);
    }

    return { data: envelope?.data ?? null, message: envelope?.message ?? "" };
}

export { API_BASE };