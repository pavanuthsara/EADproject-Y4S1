// Display helpers for booking slots inside a node (battery).
//
// Display only: capacity, positions and every booking rule are decided by the API.

export const DIRECTION_LABELS = {
    Inject: 'Energy Drop-off (Inject)',
    Draw: 'Energy Charging (Draw)',
};

export const DIRECTION_SHORT = {
    Inject: 'Drop-off',
    Draw: 'Charging',
};

export const SLOT_STATUS_STYLES = {
    Available: 'bg-green-100 text-green-800',
    Full: 'bg-amber-100 text-amber-800',
    Closed: 'bg-gray-200 text-gray-700',
};

export const RESERVATION_STATUS_STYLES = {
    Pending: 'bg-amber-100 text-amber-800',
    Approved: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800',
    Completed: 'bg-blue-100 text-blue-800',
    Cancelled: 'bg-gray-200 text-gray-700',
};

// A slot with no listed directions (older data) accepts both.
export function slotDirections(slot) {
    return slot.supportedDirections?.length ? slot.supportedDirections : ['Inject', 'Draw'];
}

// Local calendar day of an instant, e.g. "2026-10-08", used to group slots by day.
export function localDayKey(value) {
    const date = new Date(value);

    // Left-pads a number to two digits.
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Turns a "YYYY-MM-DD" day key into a long, localised date heading.
export function formatDayHeading(dayKey) {
    const [year, month, day] = dayKey.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
}

// Formats a timestamp as a local hour and minute.
export function formatTime(value) {
    return new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

// Formats a slot's start and end as a time range.
export function formatTimeRange(slot) {
    return `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}`;
}

// Percentage of the slot's energy that is booked, 0 to 100.
export function bookedPercent(slot) {
    if (!slot.capacityKwh) return 0;
    return Math.min(100, Math.max(0, (slot.reservedKwh / slot.capacityKwh) * 100));
}

// Battery colour: green while there is room, amber when filling up, red when nearly full.
export function batteryColor(percent, status) {
    if (status === 'Closed') return 'bg-gray-400';
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 60) return 'bg-amber-500';
    return 'bg-green-500';
}

// Formats an energy amount with at most 2 decimals, e.g. "2.5 kWh".
export function formatKwh(value) {
    return `${Number(Number(value).toFixed(2))} kWh`;
}
