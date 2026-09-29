// Mock service for managing Prosumers
// In a real application, these functions would use fetch() or axios to call your backend API.

let mockProsumers = [
    { nic: '199012345678', name: 'John Doe', email: 'john@example.com', phone: '0712345678', address: '123 Solar Way, Colombo', status: 'Active' },
    { nic: '198598765432', name: 'Jane Smith', email: 'jane@example.com', phone: '0777654321', address: '456 Green Rd, Kandy', status: 'Inactive' },
    { nic: '200112345678', name: 'Alice Silva', email: 'alice@example.com', phone: '0701122334', address: '789 Blue Ave, Galle', status: 'Pending' },
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function getProsumers() {
    await delay(400); // Simulate network latency
    return [...mockProsumers];
}

export async function createProsumer(data) {
    await delay(400);
    if (mockProsumers.find(p => p.nic === data.nic)) {
        throw new Error('A prosumer with this NIC already exists.');
    }
    // New accounts can start as 'Pending' or 'Active'. We'll default to Pending.
    const newProsumer = { ...data, status: 'Pending' };
    mockProsumers = [...mockProsumers, newProsumer];
    return newProsumer;
}

export async function updateProsumer(nic, data) {
    await delay(400);
    const index = mockProsumers.findIndex(p => p.nic === nic);
    if (index === -1) throw new Error('Prosumer not found.');
    
    // NIC is the primary key and shouldn't typically be changed, 
    // but we'll merge the rest of the data.
    mockProsumers[index] = { ...mockProsumers[index], ...data };
    return mockProsumers[index];
}

export async function updateProsumerStatus(nic, newStatus) {
    await delay(400);
    const index = mockProsumers.findIndex(p => p.nic === nic);
    if (index === -1) throw new Error('Prosumer not found.');
    
    mockProsumers[index] = { ...mockProsumers[index], status: newStatus };
    return mockProsumers[index];
}
