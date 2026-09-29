// Mock service for power trading (energy slot) reservations.
//
// The shapes returned here match the Web API contracts so the UI can be switched
// over by replacing the bodies with fetch() calls and nothing else:
//   POST   /api/reservations            -> ReservationSummaryResponse
//   PUT    /api/reservations/{id}       -> ReservationSummaryResponse
//   DELETE /api/reservations/{id}       -> ReservationSummaryResponse
//   GET    /api/reservations/history    -> ReservationSummaryResponse[]
//
// The rule checks below deliberately repeat the API's rules so the mock rejects
// the same requests the real endpoints would. See task.md for the wiring to-do.

import {
    BOOKING_WINDOW_DAYS,
    MINIMUM_NOTICE_HOURS,
    MODIFIABLE_STATUSES,
    RuleMessages,
    isWithinBookingWindow,
    hasSufficientNotice,
} from '../utils/reservationRules';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const HOUR = 60 * 60 * 1000;

// Slot windows are built relative to the moment the app loads so the seven-day
// and twelve-hour rules can be exercised without editing fixtures. The offsets
// cover: inside the window, too close for changes, and past the window.
const SLOT_OFFSETS = [
    { hours: 6, label: 'inside window, under 12h notice' },
    { hours: 30, labelHidden: true },
    { hours: 54, labelHidden: true },
    { hours: 3 * 24, labelHidden: true },
    { hours: 5 * 24, labelHidden: true },
    { hours: 6 * 24 + 20, labelHidden: true },
    { hours: 9 * 24, label: 'beyond the 7-day booking window' },
];

const SLOT_DURATION_HOURS = 2;

let mockStations = [
    { id: 'NODE-001', stationName: 'Colombo Central Hub', city: 'Colombo', status: 'Active' },
    { id: 'NODE-002', stationName: 'Kandy Solar Station', city: 'Kandy', status: 'Active' },
    { id: 'NODE-003', stationName: 'Galle South Hub', city: 'Galle', status: 'Active' },
];

// Builds the booking slots for every station, spread across the offsets above.
function buildSlots() {
    const base = Date.now();
    const slots = [];

    mockStations.forEach((station, stationIndex) => {
        SLOT_OFFSETS.forEach((offset, slotIndex) => {
            const start = new Date(base + offset.hours * HOUR + stationIndex * HOUR);
            const end = new Date(start.getTime() + SLOT_DURATION_HOURS * HOUR);

            slots.push({
                id: `${station.id}-SLOT-${String(slotIndex + 1).padStart(2, '0')}`,
                stationId: station.id,
                stationName: station.stationName,
                startUtc: start.toISOString(),
                endUtc: end.toISOString(),
                totalPositions: 4,
                reservedPositions: 0,
                capacityKwh: 40,
                reservedKwh: 0,
                // An empty list means the slot accepts both directions.
                supportedDirections: slotIndex % 3 === 1 ? ['Draw'] : [],
                status: slotIndex === 4 && stationIndex === 2 ? 'Closed' : 'Open',
            });
        });
    });

    return slots;
}

let mockSlots = buildSlots();

// Seeded bookings, pinned to slots that exist so the list is populated on first load.
function buildSeedReservations() {
    const now = new Date().toISOString();
    const pick = (stationId, slotIndex) =>
        mockSlots.find((s) => s.stationId === stationId && s.id.endsWith(String(slotIndex).padStart(2, '0')));

    const seeds = [
        { nic: '199012345678', slot: pick('NODE-001', 3), direction: 'Inject', kwh: 12, status: 'Approved' },
        { nic: '198598765432', slot: pick('NODE-002', 2), direction: 'Draw', kwh: 8, status: 'Pending' },
        { nic: '200112345678', slot: pick('NODE-001', 1), direction: 'Inject', kwh: 5, status: 'Approved' },
        { nic: '199012345678', slot: pick('NODE-003', 4), direction: 'Draw', kwh: 15, status: 'Completed' },
    ];

    return seeds.filter((seed) => seed.slot).map((seed, index) => {
        // Seeded bookings already hold their slot's capacity.
        seed.slot.reservedPositions += 1;
        seed.slot.reservedKwh += seed.kwh;

        return {
            reservationId: `RSV-${String(index + 1).padStart(4, '0')}`,
            reservationNo: buildReservationNo(),
            prosumerNic: seed.nic,
            status: seed.status,
            stationId: seed.slot.stationId,
            stationName: seed.slot.stationName,
            slotId: seed.slot.id,
            slotStartUtc: seed.slot.startUtc,
            slotEndUtc: seed.slot.endUtc,
            direction: seed.direction,
            requestedKwh: seed.kwh,
            createdAtUtc: now,
            updatedAtUtc: now,
            message: '',
        };
    });
}

// Builds a reservation number in the API's RES-yyyyMMdd-XXXXXXXX format.
function buildReservationNo() {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(16).slice(2, 10).toUpperCase().padEnd(8, '0');
    return `RES-${stamp}-${random}`;
}

let mockReservations = buildSeedReservations();
let nextId = mockReservations.length + 1;

// The API computes canModify/canCancel per request, so they are derived on read
// rather than stored; a stored flag would go stale as the deadline passes.
function withDerivedFlags(reservation) {
    const changeable = MODIFIABLE_STATUSES.includes(reservation.status)
        && hasSufficientNotice(reservation.slotStartUtc);

    return { ...reservation, canModify: changeable, canCancel: changeable };
}

function findSlot(slotId) {
    const slot = mockSlots.find((s) => s.id === slotId);
    if (!slot) throw new Error(`Slot ${slotId} was not found.`);
    return slot;
}

function findReservationIndex(reservationId) {
    const index = mockReservations.findIndex((r) => r.reservationId === reservationId);
    if (index === -1) throw new Error(`Reservation ${reservationId} was not found.`);
    return index;
}

// Re-runs the create-time rules: open slot, future start, inside the booking
// window, supported direction, a free position and enough kWh headroom.
function assertSlotIsBookable(slot, direction, kwh, options = {}) {
    const { ignorePositions = false, extraKwhOnly = null } = options;

    if (slot.status === 'Closed') {
        throw new Error('Slot not available: the operator has closed this slot.');
    }
    if (new Date(slot.startUtc).getTime() <= Date.now()) {
        throw new Error(RuleMessages.slotStarted);
    }
    if (!isWithinBookingWindow(slot.startUtc)) {
        throw new Error(RuleMessages.outsideBookingWindow);
    }
    if (slot.supportedDirections.length > 0 && !slot.supportedDirections.includes(direction)) {
        throw new Error(`Direction rule: this slot does not accept ${direction} reservations.`);
    }
    if (!ignorePositions && slot.reservedPositions >= slot.totalPositions) {
        throw new Error('Slot capacity rule: every position on this slot is already reserved.');
    }

    const needed = extraKwhOnly ?? kwh;
    const available = slot.capacityKwh - slot.reservedKwh;
    if (needed > available) {
        throw new Error(`Slot capacity rule: only ${Number(available.toFixed(3))} kWh is still available on this slot.`);
    }
}

// Rejects a change or cancellation on a finished booking or one inside the notice period.
function assertCanBeChanged(reservation) {
    if (!MODIFIABLE_STATUSES.includes(reservation.status)) {
        throw new Error(RuleMessages.invalidState(reservation.status));
    }
    // Measured against the booking's existing start time, never a newly requested one.
    if (!hasSufficientNotice(reservation.slotStartUtc)) {
        throw new Error(RuleMessages.insufficientNotice);
    }
}

function assertNoDuplicateBooking(prosumerNic, slotId, excludeReservationId) {
    const duplicate = mockReservations.some((r) =>
        r.prosumerNic === prosumerNic
        && r.slotId === slotId
        && r.reservationId !== excludeReservationId
        && MODIFIABLE_STATUSES.includes(r.status));

    if (duplicate) {
        throw new Error('Duplicate booking: this prosumer already holds an active reservation on this slot. Update it instead.');
    }
}

// --- Read ------------------------------------------------------------------

// GET /api/reservations/history
export async function getReservations() {
    await delay(400);
    return mockReservations
        .map(withDerivedFlags)
        .sort((a, b) => new Date(a.slotStartUtc) - new Date(b.slotStartUtc));
}

// Active microgrid nodes available to book against.
export async function getStations() {
    await delay(200);
    return mockStations.filter((s) => s.status === 'Active').map((s) => ({ ...s }));
}

// Booking slots for a node, newest capacity figures included.
export async function getSlots(stationId) {
    await delay(200);
    if (!stationId) return [];

    return mockSlots
        .filter((s) => s.stationId === stationId)
        .map((s) => ({ ...s }))
        .sort((a, b) => new Date(a.startUtc) - new Date(b.startUtc));
}

// The policy the UI validates against; the API exposes the same values from
// its ReservationPolicy configuration section.
export async function getReservationPolicy() {
    await delay(50);
    return { bookingWindowDays: BOOKING_WINDOW_DAYS, minimumNoticeHours: MINIMUM_NOTICE_HOURS };
}

// --- Write -----------------------------------------------------------------

// POST /api/reservations
export async function createReservation({ prosumerNic, slotId, direction, requestedKwh }) {
    await delay(500);

    const kwh = Number(requestedKwh);
    if (!Number.isFinite(kwh) || kwh <= 0) throw new Error(RuleMessages.kwhPositive);

    const slot = findSlot(slotId);
    assertSlotIsBookable(slot, direction, kwh);
    assertNoDuplicateBooking(prosumerNic, slotId, null);

    slot.reservedPositions += 1;
    slot.reservedKwh += kwh;

    const now = new Date().toISOString();
    const reservation = {
        reservationId: `RSV-${String(nextId++).padStart(4, '0')}`,
        reservationNo: buildReservationNo(),
        prosumerNic: prosumerNic.trim(),
        status: 'Pending',
        stationId: slot.stationId,
        stationName: slot.stationName,
        slotId: slot.id,
        slotStartUtc: slot.startUtc,
        slotEndUtc: slot.endUtc,
        direction,
        requestedKwh: kwh,
        createdAtUtc: now,
        updatedAtUtc: now,
        message: 'Reservation created and awaiting operator approval.',
    };

    mockReservations = [...mockReservations, reservation];
    return withDerivedFlags(reservation);
}

// PUT /api/reservations/{id}
export async function updateReservation(reservationId, { slotId, direction, requestedKwh }) {
    await delay(500);

    if (slotId === undefined && direction === undefined && requestedKwh === undefined) {
        throw new Error(RuleMessages.nothingToUpdate);
    }

    const index = findReservationIndex(reservationId);
    const current = mockReservations[index];
    assertCanBeChanged(current);

    const targetSlotId = slotId ?? current.slotId;
    const targetDirection = direction ?? current.direction;
    const targetKwh = requestedKwh === undefined ? current.requestedKwh : Number(requestedKwh);

    if (!Number.isFinite(targetKwh) || targetKwh <= 0) throw new Error(RuleMessages.kwhPositive);

    const slotChanging = targetSlotId !== current.slotId;
    const directionChanging = targetDirection !== current.direction;
    const kwhChanging = targetKwh !== current.requestedKwh;

    if (!slotChanging && !directionChanging && !kwhChanging) {
        return withDerivedFlags({ ...current, message: 'No changes were made to the reservation.' });
    }

    const wasApproved = current.status === 'Approved';
    const oldSlot = findSlot(current.slotId);
    let updated;

    if (slotChanging) {
        // Moving slots re-runs every create rule against the new slot, then frees the old one.
        const newSlot = findSlot(targetSlotId);
        assertSlotIsBookable(newSlot, targetDirection, targetKwh);
        assertNoDuplicateBooking(current.prosumerNic, newSlot.id, reservationId);

        newSlot.reservedPositions += 1;
        newSlot.reservedKwh += targetKwh;
        oldSlot.reservedPositions -= 1;
        oldSlot.reservedKwh -= current.requestedKwh;

        updated = {
            ...current,
            stationId: newSlot.stationId,
            stationName: newSlot.stationName,
            slotId: newSlot.id,
            slotStartUtc: newSlot.startUtc,
            slotEndUtc: newSlot.endUtc,
        };
    } else {
        // Staying on the same slot only needs headroom for the difference in kWh.
        const kwhDelta = targetKwh - current.requestedKwh;
        assertSlotIsBookable(oldSlot, targetDirection, targetKwh, {
            ignorePositions: true,
            extraKwhOnly: Math.max(0, kwhDelta),
        });

        oldSlot.reservedKwh += kwhDelta;
        updated = { ...current };
    }

    updated.direction = targetDirection;
    updated.requestedKwh = targetKwh;
    updated.updatedAtUtc = new Date().toISOString();
    // Changed terms void any approval, so the booking goes back for review.
    updated.status = 'Pending';
    updated.message = wasApproved
        ? 'Reservation updated. The terms changed, so it is back to Pending and needs approval again.'
        : 'Reservation updated.';

    mockReservations[index] = updated;
    return withDerivedFlags(updated);
}

// DELETE /api/reservations/{id}
export async function cancelReservation(reservationId) {
    await delay(500);

    const index = findReservationIndex(reservationId);
    const current = mockReservations[index];
    assertCanBeChanged(current);

    const slot = findSlot(current.slotId);
    slot.reservedPositions -= 1;
    slot.reservedKwh -= current.requestedKwh;

    const cancelled = {
        ...current,
        status: 'Cancelled',
        cancelledAtUtc: new Date().toISOString(),
        updatedAtUtc: new Date().toISOString(),
        message: 'Reservation cancelled and its capacity released.',
    };

    mockReservations[index] = cancelled;
    return withDerivedFlags(cancelled);
}
