// Mock service for managing Microgrid Nodes (Solar Hubs)
// Replace with actual API calls to the backend when ready.

let mockNodes = [
    { 
        id: 'NODE-001', 
        name: 'Colombo Central Hub', 
        gpsLocation: '6.9271, 79.8612', 
        capacity: 50, 
        batterySlots: 5, 
        status: 'Active',
        activeReservations: 2, 
        schedule: '06:00-18:00' 
    },
    { 
        id: 'NODE-002', 
        name: 'Kandy Solar Station', 
        gpsLocation: '7.2906, 80.6337', 
        capacity: 30, 
        batterySlots: 3, 
        status: 'Active',
        activeReservations: 0, 
        schedule: '07:00-17:00' 
    },
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function getNodes() {
    await delay(400);
    return [...mockNodes];
}

export async function createNode(data) {
    await delay(400);
    const newNode = {
        id: `NODE-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        ...data,
        status: 'Active',
        activeReservations: 0, // newly created nodes start with 0 reservations
        schedule: data.schedule || '00:00-23:59'
    };
    mockNodes = [...mockNodes, newNode];
    return newNode;
}

export async function updateNodeSchedule(id, newSchedule) {
    await delay(400);
    const index = mockNodes.findIndex(n => n.id === id);
    if (index === -1) throw new Error('Node not found');
    
    mockNodes[index] = { ...mockNodes[index], schedule: newSchedule };
    return mockNodes[index];
}

export async function deactivateNode(id) {
    await delay(400);
    const index = mockNodes.findIndex(n => n.id === id);
    if (index === -1) throw new Error('Node not found');
    
    // Check if node has active reservations
    if (mockNodes[index].activeReservations > 0) {
        throw new Error(`Cannot deactivate node: There are ${mockNodes[index].activeReservations} active energy reservations.`);
    }

    mockNodes[index] = { ...mockNodes[index], status: 'Inactive' };
    return mockNodes[index];
}

export async function activateNode(id) {
    await delay(400);
    const index = mockNodes.findIndex(n => n.id === id);
    if (index === -1) throw new Error('Node not found');

    mockNodes[index] = { ...mockNodes[index], status: 'Active' };
    return mockNodes[index];
}
