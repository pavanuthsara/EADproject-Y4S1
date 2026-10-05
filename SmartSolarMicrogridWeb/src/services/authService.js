import { API_BASE } from "../config";

// Signs in and stores the token and role in localStorage.
async function login(email, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.message || "Login failed");
    }

    localStorage.setItem("token", data.data.token);
    localStorage.setItem("role", data.data.role);

    return data.data;
}

/**
 * Self-registration for Prosumers.
 * Saves account with AccountStatus = 'Pending'.
 * @param {object} prosumerData
 *   { nic, fullName, email, phone, password, address, solarCapacityKw }
 */
async function registerProsumer(prosumerData) {
    // Try /api/prosumer/register first, fallback to /api/auth/register
    let response;
    try {
        response = await fetch(`${API_BASE}/prosumer/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(prosumerData),
        });
    } catch {
        // network or server error fallback
        response = await fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(prosumerData),
        });
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
        throw new Error(data.message || "Registration failed. Please check your information.");
    }

    return data.data;
}

/**
 * Checks prosumer registration and backoffice approval status.
 * @param {string} identifier - NIC or Email
 */
async function checkProsumerStatus(identifier) {
    const response = await fetch(`${API_BASE}/prosumer/status/${encodeURIComponent(identifier)}`, {
        method: "GET",
        headers: { "Accept": "application/json" },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
        throw new Error(data.message || "No prosumer record found for this identifier.");
    }

    return data.data;
}

// Signs out by removing the stored token and role.
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
}

// Returns the stored JWT, or null if signed out.
function getToken() {
    return localStorage.getItem("token");
}

// Returns the signed-in user's role, or null if signed out.
function getRole() {
    return localStorage.getItem("role");
}

export { login, logout, getToken, getRole, registerProsumer, checkProsumerStatus, API_BASE };