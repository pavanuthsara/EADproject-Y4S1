const API_BASE = "http://localhost:5014/api";

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

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
}

function getToken() {
    return localStorage.getItem("token");
}

function getRole() {
    return localStorage.getItem("role");
}

export { login, logout, getToken, getRole };