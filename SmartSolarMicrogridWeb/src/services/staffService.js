// Service for managing internal staff (Backoffice / Grid Operators)
// Fully hooked up to the .NET Backend API

const API_BASE = "http://localhost:5014/api/users";

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

export async function createStaff(data) {
    const response = await fetch(`${API_BASE}/staff`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        // We supply dummy NIC/Phone/Address if they aren't provided in the UI
        body: JSON.stringify({
            ...data,
            nic: data.nic || `NIC${Math.floor(Math.random() * 1000000)}`,
            phone: data.phone || "0000000000",
            address: data.address || "N/A"
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create staff member');
    }
    
    const result = await response.json();
    return result.data;
}

export async function updateStaff(id, data) {
    const response = await fetch(`${API_BASE}/staff/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update staff member');
    }
    
    const result = await response.json();
    return result.data;
}

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
