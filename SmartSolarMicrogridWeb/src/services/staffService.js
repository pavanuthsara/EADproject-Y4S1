// Service for managing internal staff (Backoffice / Grid Operators)
// Fully hooked up to the .NET Backend API

import { API_BASE as API_ROOT } from "../config";

const API_BASE = `${API_ROOT}/users`;

// Fetches all staff accounts.
export async function getStaff() {
    const response = await fetch(`${API_BASE}/staff`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    
    if (!response.ok) throw new Error('Failed to fetch staff');
    
    const result = await response.json();
    return result.data; // The .NET API returns { success, message, data }
}

// Creates a staff account.
export async function createStaff(data) {
    const response = await fetch(`${API_BASE}/staff`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
            role: data.role,
            fullName: data.name, // Mapping UI 'name' to Backend 'FullName'
            email: data.email,
            password: data.password,
            nic: data.nic || `99999${Math.floor(10000 + Math.random() * 90000)}V`, // Ensures 10+ characters for NIC validation
            phone: data.phone || "0770000000", // Valid phone number format
            address: data.address || "Corporate Office"
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create staff member');
    }
    
    const result = await response.json();
    return result.data;
}

// Updates a staff member's details.
export async function updateStaff(id, data) {
    const response = await fetch(`${API_BASE}/staff/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
            role: data.role,
            fullName: data.name,
            email: data.email
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update staff member');
    }
    
    const result = await response.json();
    return result.data;
}

// Sets a staff member's account status.
export async function updateStaffStatus(id, newStatus) {
    const response = await fetch(`${API_BASE}/staff/${id}/status`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update staff status');
    }
    
    const result = await response.json();
    return result.data;
}
