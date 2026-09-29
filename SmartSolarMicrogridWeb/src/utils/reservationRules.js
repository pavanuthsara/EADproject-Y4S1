// Client-side reservation rules for the web app.
//
// These mirror the Web API's ReservationPolicy section (appsettings.json:
// BookingWindowDays = 7, MinimumNoticeHours = 12) so the UI can block an
// invalid action before it is sent. The API remains the authority; this module
// only keeps staff from submitting requests the API would reject anyway.
// Messages match the API's ReservationMessages so the same wording is shown
// whichever side rejects the request.

export const BOOKING_WINDOW_DAYS = 7;
export const MINIMUM_NOTICE_HOURS = 12;

// Only these statuses can still be changed or cancelled.
export const MODIFIABLE_STATUSES = ['Pending', 'Approved'];

export const ENERGY_DIRECTIONS = ['Inject', 'Draw'];

// The directions a slot accepts. An empty list on the slot means it accepts both.
export function directionsForSlot(slot) {
    if (!slot || slot.supportedDirections.length === 0) return ENERGY_DIRECTIONS;
    return slot.supportedDirections;
}

export const RESERVATION_STATUSES = ['Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled'];

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export const RuleMessages = {
    slotStarted: 'Slot already started: bookings are only accepted for slots that start in the future.',
    outsideBookingWindow: `Booking window rule: slots can only be booked up to ${BOOKING_WINDOW_DAYS} days in advance.`,
    insufficientNotice: `Notice rule: reservations can only be changed or cancelled at least ${MINIMUM_NOTICE_HOURS} hours before the start time.`,
    invalidState: (status) => `State rule: a ${status} reservation can no longer be changed or cancelled.`,
    invalidDate: 'Select a valid start time for the reservation.',
    directionNotSupported: (direction) => `Direction rule: this slot does not accept ${direction} reservations.`,
    kwhRequired: 'Enter the energy amount in kWh.',
    kwhPositive: 'requestedKwh must be greater than zero.',
    nothingToUpdate: 'Provide at least one of slot, direction or kWh to update.',
};

// --- Date helpers ----------------------------------------------------------

// Formats an instant for an <input type="datetime-local"> value (local time).
export function toLocalInputValue(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
        + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Converts a datetime-local value (local time) back to a UTC ISO string.
export function fromLocalInputValue(localValue) {
    if (!localValue) return null;
    const date = new Date(localValue);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

// Shows a UTC instant in the signed-in user's own time zone.
export function formatDateTime(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    });
}

// Hours from now until the given instant; negative once it has passed.
export function hoursUntil(value, now = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return Number.NaN;
    return (date.getTime() - now.getTime()) / MS_PER_HOUR;
}

// Turns a duration in hours into a short "2d 5h" / "7h 30m" label.
export function formatDuration(hours) {
    if (!Number.isFinite(hours)) return '—';

    const totalMinutes = Math.max(0, Math.round(hours * 60));
    const days = Math.floor(totalMinutes / (24 * 60));
    const remainingHours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) return `${days}d ${remainingHours}h`;
    if (remainingHours > 0) return `${remainingHours}h ${minutes}m`;
    return `${minutes}m`;
}

// --- The seven-day booking window -----------------------------------------

// Earliest and latest start time a new booking may have, as datetime-local
// values so they can be fed straight into an input's min/max attributes.
export function bookingWindowBounds(now = new Date()) {
    const latest = new Date(now.getTime() + BOOKING_WINDOW_DAYS * MS_PER_DAY);
    return {
        earliest: now,
        latest,
        minLocal: toLocalInputValue(now),
        maxLocal: toLocalInputValue(latest),
    };
}

// True when a start time is in the future and no more than seven days ahead.
export function isWithinBookingWindow(startValue, now = new Date()) {
    const start = startValue instanceof Date ? startValue : new Date(startValue);
    if (Number.isNaN(start.getTime())) return false;

    return start.getTime() > now.getTime()
        && start.getTime() <= now.getTime() + BOOKING_WINDOW_DAYS * MS_PER_DAY;
}

// Checks a proposed start time against the booking window rule.
export function validateSlotStart(startValue, now = new Date()) {
    const start = startValue instanceof Date ? startValue : new Date(startValue);

    if (!startValue || Number.isNaN(start.getTime())) {
        return { valid: false, message: RuleMessages.invalidDate };
    }
    if (start.getTime() <= now.getTime()) {
        return { valid: false, message: RuleMessages.slotStarted };
    }
    if (start.getTime() > now.getTime() + BOOKING_WINDOW_DAYS * MS_PER_DAY) {
        return { valid: false, message: RuleMessages.outsideBookingWindow };
    }
    return { valid: true, message: '' };
}

// --- The twelve-hour notice period ----------------------------------------

// The last moment a booking starting at slotStart can still be changed or cancelled.
export function noticeDeadline(slotStartValue) {
    const start = slotStartValue instanceof Date ? slotStartValue : new Date(slotStartValue);
    if (Number.isNaN(start.getTime())) return null;
    return new Date(start.getTime() - MINIMUM_NOTICE_HOURS * MS_PER_HOUR);
}

// True when the start time is still at least twelve hours away.
export function hasSufficientNotice(slotStartValue, now = new Date()) {
    const hours = hoursUntil(slotStartValue, now);
    return Number.isFinite(hours) && hours >= MINIMUM_NOTICE_HOURS;
}

// Whether a reservation may still be changed or cancelled, and why not if it may not.
// The notice period is always measured against the booking's existing start time,
// never against a newly requested one, which is what the API does too.
export function evaluateChangeEligibility(reservation, now = new Date()) {
    if (!reservation) {
        return { allowed: false, reason: 'No reservation selected.' };
    }
    if (!MODIFIABLE_STATUSES.includes(reservation.status)) {
        return { allowed: false, reason: RuleMessages.invalidState(reservation.status) };
    }
    if (!hasSufficientNotice(reservation.slotStartUtc, now)) {
        return { allowed: false, reason: RuleMessages.insufficientNotice };
    }
    return { allowed: true, reason: '' };
}

// A short label for how much of the notice period is left.
export function describeNotice(reservation, now = new Date()) {
    const hours = hoursUntil(reservation?.slotStartUtc, now);
    if (!Number.isFinite(hours)) return { tone: 'neutral', label: '—' };

    if (hours <= 0) {
        return { tone: 'expired', label: 'Slot has already started' };
    }
    if (hours < MINIMUM_NOTICE_HOURS) {
        return { tone: 'expired', label: `Notice window closed · starts in ${formatDuration(hours)}` };
    }

    const remaining = hours - MINIMUM_NOTICE_HOURS;
    const tone = remaining <= 6 ? 'warning' : 'ok';
    return { tone, label: `${formatDuration(remaining)} left to change or cancel` };
}

// --- Field validation -----------------------------------------------------

// Checks the requested energy amount, optionally against the headroom left on a slot.
export function validateRequestedKwh(value, availableKwh = null) {
    if (value === '' || value === null || value === undefined) {
        return { valid: false, message: RuleMessages.kwhRequired };
    }

    const kwh = Number(value);
    if (Number.isNaN(kwh) || kwh <= 0) {
        return { valid: false, message: RuleMessages.kwhPositive };
    }
    if (availableKwh !== null && kwh > availableKwh) {
        return {
            valid: false,
            message: `Slot capacity rule: only ${Number(availableKwh.toFixed(3))} kWh is still available on this slot.`
        };
    }
    return { valid: true, message: '' };
}

// Validates everything a create request needs before it is sent.
export function validateCreateForm(form, slot, now = new Date()) {
    const errors = {};

    if (!form.prosumerNic?.trim()) {
        errors.prosumerNic = 'Enter the prosumer NIC the booking belongs to.';
    }
    if (!form.stationId) {
        errors.stationId = 'Select a microgrid node.';
    }
    if (!form.slotId) {
        errors.slotId = 'Select a booking slot.';
    } else {
        const window = validateSlotStart(slot?.startUtc, now);
        if (!window.valid) errors.slotId = window.message;
    }
    if (!ENERGY_DIRECTIONS.includes(form.direction)) {
        errors.direction = 'Choose whether energy is injected or drawn.';
    } else if (slot && !directionsForSlot(slot).includes(form.direction)) {
        errors.direction = RuleMessages.directionNotSupported(form.direction);
    }

    const headroom = slot ? slot.capacityKwh - slot.reservedKwh : null;
    const kwh = validateRequestedKwh(form.requestedKwh, headroom);
    if (!kwh.valid) errors.requestedKwh = kwh.message;

    return { valid: Object.keys(errors).length === 0, errors };
}

// Validates an update request: the notice rule on the current booking, the booking
// window on any new slot, and that at least one field actually changed.
export function validateUpdateForm(form, reservation, slot, now = new Date()) {
    const errors = {};

    const eligibility = evaluateChangeEligibility(reservation, now);
    if (!eligibility.allowed) {
        return { valid: false, errors: { form: eligibility.reason } };
    }

    const slotChanging = form.slotId !== reservation.slotId;
    const directionChanging = form.direction !== reservation.direction;
    const kwhChanging = Number(form.requestedKwh) !== Number(reservation.requestedKwh);

    if (!slotChanging && !directionChanging && !kwhChanging) {
        errors.form = RuleMessages.nothingToUpdate;
    }

    if (slotChanging) {
        const window = validateSlotStart(slot?.startUtc, now);
        if (!window.valid) errors.slotId = window.message;
    }

    // A slot only has to accept the direction when one of the two is changing.
    if ((slotChanging || directionChanging) && slot && !directionsForSlot(slot).includes(form.direction)) {
        errors.direction = RuleMessages.directionNotSupported(form.direction);
    }

    if (kwhChanging) {
        // The booking's own kWh is already counted on its current slot, so staying on
        // that slot leaves its existing amount available to re-use.
        const headroom = slot
            ? slot.capacityKwh - slot.reservedKwh + (slotChanging ? 0 : Number(reservation.requestedKwh))
            : null;
        const kwh = validateRequestedKwh(form.requestedKwh, headroom);
        if (!kwh.valid) errors.requestedKwh = kwh.message;
    }

    return { valid: Object.keys(errors).length === 0, errors };
}
