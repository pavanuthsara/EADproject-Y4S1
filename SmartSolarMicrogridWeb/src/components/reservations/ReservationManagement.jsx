import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    getReservations,
    getStations,
    getSlots,
    getReservationPolicy,
    createReservation,
    updateReservation,
    cancelReservation,
} from '../../services/reservationService';
import {
    RESERVATION_STATUSES,
    directionsForSlot,
    bookingWindowBounds,
    isWithinBookingWindow,
    evaluateChangeEligibility,
    describeNotice,
    noticeDeadline,
    validateCreateForm,
    validateUpdateForm,
    validateSlotStart,
    formatDateTime,
    formatDuration,
    hoursUntil,
} from '../../utils/reservationRules';
import ReservationDecisionActions from './ReservationDecisionActions';

const EMPTY_FORM = { prosumerNic: '', stationId: '', slotId: '', direction: 'Inject', requestedKwh: '' };

// The clock is re-read on this interval so a booking locks itself on screen as
// soon as it crosses the twelve-hour notice deadline.
const CLOCK_TICK_MS = 30_000;

const STATUS_STYLES = {
    Pending: 'bg-amber-100 text-amber-800',
    Approved: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800',
    Completed: 'bg-blue-100 text-blue-800',
    Cancelled: 'bg-gray-200 text-gray-700',
};

const NOTICE_STYLES = {
    ok: 'text-green-700',
    warning: 'text-amber-700',
    expired: 'text-red-700',
    neutral: 'text-gray-500',
};

// Why a slot may not be booked, or how much room it has left if it may.
function describeSlot(slot, now, policy) {
    if (slot.status === 'Closed') {
        return { selectable: false, note: 'closed by operator' };
    }
    if (new Date(slot.startTime).getTime() <= now.getTime()) {
        return { selectable: false, note: 'already started' };
    }
    if (!isWithinBookingWindow(slot.startTime, now, policy)) {
        return { selectable: false, note: `outside the ${policy.bookingWindowDays}-day window` };
    }
    if (slot.reservedPositions >= slot.totalPositions) {
        return { selectable: false, note: 'all positions reserved' };
    }

    const available = slot.capacityKwh - slot.reservedKwh;
    if (available <= 0) {
        return { selectable: false, note: 'no kWh left' };
    }
    return { selectable: true, note: `${Number(available.toFixed(3))} kWh free` };
}

// Staff screen for listing, creating, updating and cancelling energy reservations.
export default function ReservationManagement() {
    const [reservations, setReservations] = useState([]);
    const [stations, setStations] = useState([]);
    const [slots, setSlots] = useState([]);
    const [policy, setPolicy] = useState({ bookingWindowDays: 7, minimumNoticeHours: 12 });

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [summary, setSummary] = useState('');

    const [now, setNow] = useState(() => new Date());

    // 'create' | 'update' | null
    const [mode, setMode] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [fieldErrors, setFieldErrors] = useState({});
    const [pendingCancelId, setPendingCancelId] = useState(null);

    const [filters, setFilters] = useState({ status: 'All', stationId: 'All', nic: '' });

    useEffect(() => {
        loadAll();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
        return () => clearInterval(timer);
    }, []);

    // Slots are per node, so they are refetched whenever the chosen node changes.
    // An empty node yields an empty list, which clears any previous node's slots.
    useEffect(() => {
        let cancelled = false;
        getSlots(form.stationId)
            .then((data) => { if (!cancelled) setSlots(data); })
            .catch(() => { if (!cancelled) setError('Failed to load booking slots for this node.'); });

        return () => { cancelled = true; };
    }, [form.stationId]);

    // Loads reservations, stations and the reservation policy in parallel.
    const loadAll = async () => {
        setIsLoading(true);
        try {
            const [reservationData, stationData, policyData] = await Promise.all([getReservations(), getStations(), getReservationPolicy()]);
            setReservations(reservationData);
            setStations(stationData);
            setPolicy(policyData);
            setError('');
        } catch {
            setError('Failed to load reservations or policy.');
        } finally {
            setIsLoading(false);
        }
    };

    const editingReservation = useMemo(
        () => reservations.find((r) => r.reservationId === editingId) ?? null,
        [reservations, editingId]
    );

    const selectedSlot = useMemo(
        () => slots.find((s) => s.id === form.slotId) ?? null,
        [slots, form.slotId]
    );

    const windowBounds = useMemo(() => bookingWindowBounds(now, policy), [now, policy]);

    // A slot may only accept one direction; an empty list means it accepts both.
    const allowedDirections = useMemo(() => directionsForSlot(selectedSlot), [selectedSlot]);

    const validation = useMemo(() => {
        if (mode === 'create') return validateCreateForm(form, selectedSlot, now, policy);
        if (mode === 'update' && editingReservation) {
            return validateUpdateForm(form, editingReservation, selectedSlot, now, policy);
        }
        return { valid: false, errors: {} };
    }, [mode, form, selectedSlot, editingReservation, now, policy]);

    const visibleReservations = useMemo(() => {
        const nic = filters.nic.trim().toLowerCase();
        return reservations.filter((r) => {
            if (filters.status !== 'All' && r.status !== filters.status) return false;
            if (filters.stationId !== 'All' && r.stationId !== filters.stationId) return false;
            if (nic && !r.prosumerNic.toLowerCase().includes(nic)) return false;
            return true;
        });
    }, [reservations, filters]);

    const counts = useMemo(() => {
        const pending = reservations.filter((r) => r.status === 'Pending').length;
        const approvedFuture = reservations.filter(
            (r) => r.status === 'Approved' && new Date(r.slotStartUtc) > now
        ).length;
        const locked = reservations.filter(
            (r) => !evaluateChangeEligibility(r, now, policy).allowed && ['Pending', 'Approved'].includes(r.status)
        ).length;

        return { total: reservations.length, pending, approvedFuture, locked };
    }, [reservations, now, policy]);

    // Closes the create/update panel and clears the form.
    const resetPanel = useCallback(() => {
        setMode(null);
        setEditingId(null);
        setForm(EMPTY_FORM);
        setFieldErrors({});
    }, []);

    // Opens an empty form for a new reservation.
    const openCreate = () => {
        setError('');
        setSummary('');
        setFieldErrors({});
        setEditingId(null);
        setForm(EMPTY_FORM);
        setMode('create');
    };

    // The notice rule is re-checked here so a booking that has since crossed the
    // deadline cannot be opened for editing at all.
    const openUpdate = (reservation) => {
        const eligibility = evaluateChangeEligibility(reservation, now, policy);
        if (!eligibility.allowed) {
            setError(eligibility.reason);
            return;
        }

        setError('');
        setSummary('');
        setFieldErrors({});
        setEditingId(reservation.reservationId);
        setForm({
            prosumerNic: reservation.prosumerNic,
            stationId: reservation.stationId,
            slotId: reservation.slotId,
            direction: reservation.direction,
            requestedKwh: String(reservation.requestedKwh),
        });
        setMode('update');
    };

    // Updates a form field and clears its error, resetting fields that depend on it.
    const handleFieldChange = (event) => {
        const { name, value } = event.target;

        setForm((prev) => {
            const next = { ...prev, [name]: value };

            // Changing the node invalidates the chosen slot.
            if (name === 'stationId') next.slotId = '';

            // A slot may accept only one direction. Snapping the direction here keeps
            // the stored value equal to what the select actually shows, which would
            // otherwise drift and send a direction the slot rejects.
            if (name === 'slotId') {
                const allowed = directionsForSlot(slots.find((s) => s.id === value));
                if (!allowed.includes(next.direction)) next.direction = allowed[0];
            }

            return next;
        });
        setFieldErrors((prev) => ({ ...prev, [name]: undefined, direction: undefined, form: undefined }));
    };

    // Validates the form and creates the reservation.
    const handleCreateSubmit = async (event) => {
        event.preventDefault();

        const checkedNow = new Date();
        const result = validateCreateForm(form, selectedSlot, checkedNow, policy);
        if (!result.valid) {
            setFieldErrors(result.errors);
            return;
        }

        setIsSubmitting(true);
        setError('');
        try {
            const created = await createReservation({
                prosumerNic: form.prosumerNic.trim(),
                stationId: form.stationId,
                slotId: form.slotId,
                direction: form.direction,
                requestedKwh: Number(form.requestedKwh),
            });
            setSummary(`${created.reservationNo} — ${created.message}`);
            resetPanel();
            await loadAll();
        } catch (err) {
            setError(err.message || 'Error creating reservation.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Validates the changes and updates the reservation being edited.
    const handleUpdateSubmit = async (event) => {
        event.preventDefault();
        if (!editingReservation) return;

        // Validated against a fresh clock, not the ticking state, so a deadline that
        // passed between the last tick and this click still blocks the request.
        const checkedNow = new Date();
        const result = validateUpdateForm(form, editingReservation, selectedSlot, checkedNow, policy);
        if (!result.valid) {
            setFieldErrors(result.errors);
            return;
        }

        setIsSubmitting(true);
        setError('');
        try {
            const updated = await updateReservation(editingReservation.reservationId, {
                prosumerNic: form.prosumerNic.trim(),
                slotId: form.slotId,
                direction: form.direction,
                requestedKwh: Number(form.requestedKwh),
            });
            setSummary(`${updated.reservationNo} — ${updated.message}`);
            resetPanel();
            await loadAll();
        } catch (err) {
            setError(err.message || 'Error updating reservation.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Called after staff approve or reject a reservation; the list is reloaded from the API.
    const handleDecided = async (updated) => {
        setError('');
        setSummary(`${updated.reservationNo} — ${updated.message}`);
        await loadAll();
    };

    // Cancels a reservation after the user confirms, re-checking the notice rule first.
    const handleCancelConfirmed = async (reservation) => {
        const eligibility = evaluateChangeEligibility(reservation, new Date(), policy);
        if (!eligibility.allowed) {
            setError(eligibility.reason);
            setPendingCancelId(null);
            return;
        }

        setIsSubmitting(true);
        setError('');
        try {
            const cancelled = await cancelReservation(reservation.reservationId, reservation.prosumerNic);
            setSummary(`${cancelled.reservationNo} — ${cancelled.message}`);
            setPendingCancelId(null);
            if (editingId === reservation.reservationId) resetPanel();
            await loadAll();
        } catch (err) {
            setError(err.message || 'Error cancelling reservation.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading && reservations.length === 0) {
        return (
            <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:justify-between md:items-center bg-gray-50 gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">Power Trading Reservations</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        View, create, update and cancel energy slot bookings.
                    </p>
                </div>
                <button
                    onClick={mode === 'create' ? resetPanel : openCreate}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm whitespace-nowrap"
                >
                    {mode === 'create' ? 'Cancel Booking Form' : '+ New Reservation'}
                </button>
            </div>

            {/* Policy notice: the two rules this screen enforces */}
            <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-4 grid gap-2 md:grid-cols-2 text-sm">
                <p className="text-indigo-900">
                    <span className="font-semibold">{policy.bookingWindowDays}-day booking window:</span>{' '}
                    slots must start before{' '}
                    <span className="font-medium">{formatDateTime(windowBounds.latest)}</span>.
                </p>
                <p className="text-indigo-900">
                    <span className="font-semibold">{policy.minimumNoticeHours}-hour notice:</span>{' '}
                    updates and cancellations close {policy.minimumNoticeHours} hours before the slot starts.
                </p>
            </div>

            {/* Counts */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 border-b border-gray-200">
                <SummaryTile label="Total Bookings" value={counts.total} />
                <SummaryTile label="Pending Approval" value={counts.pending} tone="amber" />
                <SummaryTile label="Approved (Future)" value={counts.approvedFuture} tone="green" />
                <SummaryTile label="Locked by Notice Rule" value={counts.locked} tone="red" />
            </div>

            {/* Action summary / error */}
            {summary && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 mx-6 mt-6">
                    <p className="text-green-800 text-sm">{summary}</p>
                </div>
            )}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-6 mt-6">
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            {/* Create / Update form */}
            {mode && (
                <div className="p-6 border-b border-gray-200 bg-indigo-50/30">
                    <h3 className="text-lg font-medium text-gray-800 mb-1">
                        {mode === 'create' ? 'Create Reservation' : `Update ${editingReservation?.reservationNo ?? ''}`}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                        {mode === 'create'
                            ? `Only slots starting within the next ${policy.bookingWindowDays} days can be booked.`
                            : `Slot, direction and kWh can be changed until ${formatDateTime(noticeDeadline(editingReservation?.slotStartUtc, policy))}.`}
                    </p>

                    {fieldErrors.form && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                            <p className="text-red-700 text-sm">{fieldErrors.form}</p>
                        </div>
                    )}

                    <form
                        onSubmit={mode === 'create' ? handleCreateSubmit : handleUpdateSubmit}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        <Field label="Prosumer NIC" error={fieldErrors.prosumerNic}>
                            <input
                                type="text"
                                name="prosumerNic"
                                value={form.prosumerNic}
                                onChange={handleFieldChange}
                                disabled={mode === 'update'}
                                placeholder="e.g. 199012345678"
                                className="w-full border border-gray-300 rounded-md p-2 disabled:bg-gray-100 disabled:text-gray-500"
                            />
                        </Field>

                        <Field label="Microgrid Node" error={fieldErrors.stationId}>
                            <select
                                name="stationId"
                                value={form.stationId}
                                onChange={handleFieldChange}
                                className="w-full border border-gray-300 rounded-md p-2 bg-white"
                            >
                                <option value="">Select a node…</option>
                                {stations.map((station) => (
                                    <option key={station.id} value={station.id}>
                                        {station.stationName} — {station.city}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Booking Slot" error={fieldErrors.slotId}>
                            <select
                                name="slotId"
                                value={form.slotId}
                                onChange={handleFieldChange}
                                disabled={!form.stationId}
                                className="w-full border border-gray-300 rounded-md p-2 bg-white disabled:bg-gray-100"
                            >
                                <option value="">
                                    {form.stationId ? 'Select a slot…' : 'Choose a node first'}
                                </option>
                                {slots.map((slot) => {
                                    const info = describeSlot(slot, now, policy);
                                    const isCurrent = mode === 'update' && slot.id === editingReservation?.slotId;
                                    return (
                                        <option
                                            key={slot.id}
                                            value={slot.id}
                                            // The booking's own slot stays selectable: keeping it is not a
                                            // new booking, so the window rule does not apply to it.
                                            disabled={!info.selectable && !isCurrent}
                                        >
                                            {formatDateTime(slot.startTime)}
                                            {isCurrent ? ' · current slot' : ''}
                                            {` · ${info.note}`}
                                        </option>
                                    );
                                })}
                            </select>
                        </Field>

                        <Field label="Direction" error={fieldErrors.direction}>
                            <select
                                name="direction"
                                value={form.direction}
                                onChange={handleFieldChange}
                                className="w-full border border-gray-300 rounded-md p-2 bg-white"
                            >
                                {allowedDirections.map((direction) => (
                                    <option key={direction} value={direction}>{direction}</option>
                                ))}
                            </select>
                            {selectedSlot && selectedSlot.supportedDirections.length > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                    This slot only accepts {selectedSlot.supportedDirections.join(' and ')}.
                                </p>
                            )}
                        </Field>

                        <Field label="Energy (kWh)" error={fieldErrors.requestedKwh}>
                            <input
                                type="number"
                                name="requestedKwh"
                                value={form.requestedKwh}
                                onChange={handleFieldChange}
                                min="0.001"
                                step="0.5"
                                placeholder="e.g. 10"
                                className="w-full border border-gray-300 rounded-md p-2"
                            />
                            {selectedSlot && (
                                <p className="text-xs text-gray-500 mt-1">
                                    {Number((selectedSlot.capacityKwh - selectedSlot.reservedKwh).toFixed(3))} kWh
                                    of {selectedSlot.capacityKwh} kWh still free on this slot.
                                </p>
                            )}
                        </Field>

                        <div className="flex items-end gap-2">
                            <button
                                type="submit"
                                disabled={isSubmitting || !validation.valid}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting
                                    ? 'Saving…'
                                    : mode === 'create' ? 'Create Reservation' : 'Save Changes'}
                            </button>
                            <button
                                type="button"
                                onClick={resetPanel}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>

                    {/* Live read-out of the rule checks on the chosen slot */}
                    {selectedSlot && (
                        <SlotRuleCheck
                            slot={selectedSlot}
                            reservation={mode === 'update' ? editingReservation : null}
                            now={now}
                            policy={policy}
                        />
                    )}
                </div>
            )}

            {/* Filters */}
            <div className="p-6 border-b border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50/50">
                <Field label="Filter by Status">
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md p-2 bg-white"
                    >
                        <option value="All">All statuses</option>
                        {RESERVATION_STATUSES.map((status) => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </Field>
                <Field label="Filter by Node">
                    <select
                        value={filters.stationId}
                        onChange={(e) => setFilters((p) => ({ ...p, stationId: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md p-2 bg-white"
                    >
                        <option value="All">All nodes</option>
                        {stations.map((station) => (
                            <option key={station.id} value={station.id}>{station.stationName}</option>
                        ))}
                    </select>
                </Field>
                <Field label="Search Prosumer NIC">
                    <input
                        type="text"
                        value={filters.nic}
                        onChange={(e) => setFilters((p) => ({ ...p, nic: e.target.value }))}
                        placeholder="Enter a NIC…"
                        className="w-full border border-gray-300 rounded-md p-2"
                    />
                </Field>
            </div>

            {/* Reservation list */}
            <div className="p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {visibleReservations.map((reservation) => (
                        <ReservationCard
                            key={reservation.reservationId}
                            reservation={reservation}
                            now={now}
                            policy={policy}
                            isBusy={isSubmitting}
                            isConfirmingCancel={pendingCancelId === reservation.reservationId}
                            onEdit={() => openUpdate(reservation)}
                            onRequestCancel={() => {
                                setError('');
                                setPendingCancelId(reservation.reservationId);
                            }}
                            onAbortCancel={() => setPendingCancelId(null)}
                            onConfirmCancel={() => handleCancelConfirmed(reservation)}
                            onDecided={handleDecided}
                            onDecisionError={setError}
                        />
                    ))}
                    {visibleReservations.length === 0 && (
                        <div className="col-span-full p-8 text-center text-gray-500">
                            {reservations.length === 0
                                ? 'No reservations have been made yet.'
                                : 'No reservations match the current filters.'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Presentational pieces -------------------------------------------------

// Small stat tile for the summary row.
function SummaryTile({ label, value, tone = 'indigo' }) {
    const tones = {
        indigo: 'text-indigo-600',
        amber: 'text-amber-600',
        green: 'text-green-600',
        red: 'text-red-600',
    };

    return (
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${tones[tone]}`}>{value}</p>
        </div>
    );
}

// Labelled form field with an optional error message.
function Field({ label, error, children }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            {children}
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
    );
}

// Spells out how the chosen slot scores against each rule, so a blocked submit
// button always has a visible reason next to it.
function SlotRuleCheck({ slot, reservation, now, policy }) {
    const startCheck = validateSlotStart(slot.startTime, now, policy);
    const hours = hoursUntil(slot.startTime, now);

    const checks = [
        {
            label: `Starts within ${policy.bookingWindowDays} days`,
            passed: startCheck.valid,
            detail: startCheck.valid
                ? `starts in ${formatDuration(hours)}`
                : startCheck.message,
        },
    ];

    if (reservation) {
        const eligibility = evaluateChangeEligibility(reservation, now, policy);
        const notice = describeNotice(reservation, now, policy);
        checks.push({
            label: `At least ${policy.minimumNoticeHours} hours' notice`,
            passed: eligibility.allowed,
            detail: eligibility.allowed ? notice.label : eligibility.reason,
        });
    }

    return (
        <div className="mt-4 border-t border-indigo-100 pt-4 space-y-2">
            {checks.map((check) => (
                <p key={check.label} className="text-sm flex items-start gap-2">
                    <span className={check.passed ? 'text-green-600' : 'text-red-600'}>
                        {check.passed ? '✓' : '✗'}
                    </span>
                    <span className="text-gray-700">
                        <span className="font-medium">{check.label}</span>
                        <span className="text-gray-500"> — {check.detail}</span>
                    </span>
                </p>
            ))}
        </div>
    );
}

// Card showing one reservation with its notice status and edit/cancel/decision actions.
function ReservationCard({
    reservation, now, policy, isBusy, isConfirmingCancel,
    onEdit, onRequestCancel, onAbortCancel, onConfirmCancel, onDecided, onDecisionError,
}) {
    const eligibility = evaluateChangeEligibility(reservation, now, policy);
    const notice = describeNotice(reservation, now, policy);
    const deadline = noticeDeadline(reservation.slotStartUtc, policy);

    return (
        <div className="border border-gray-200 rounded-lg p-5 shadow-sm bg-white flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-base font-bold text-gray-900 font-mono">{reservation.reservationNo}</h3>
                    <p className="text-xs text-gray-500 mt-1">NIC {reservation.prosumerNic}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[reservation.status]}`}>
                    {reservation.status}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <Detail label="Node" value={reservation.stationName} />
                <Detail label="Direction" value={reservation.direction} />
                <Detail label="Energy" value={`${reservation.requestedKwh} kWh`} />
                <Detail label="Slot" value={reservation.slotId} mono />
            </div>

            <div className="border-t border-gray-100 pt-4 mb-4 space-y-1">
                <p className="text-sm text-gray-800">
                    <span className="block text-gray-500 text-xs uppercase tracking-wider mb-1">Scheduled</span>
                    {formatDateTime(reservation.slotStartUtc)} → {formatDateTime(reservation.slotEndUtc)}
                </p>
                <p className={`text-xs font-medium ${NOTICE_STYLES[notice.tone]}`}>{notice.label}</p>
                {deadline && ['Pending', 'Approved'].includes(reservation.status) && (
                    <p className="text-xs text-gray-500">
                        Change/cancel deadline: {formatDateTime(deadline)}
                    </p>
                )}
            </div>

            {reservation.status === 'Rejected' && reservation.rejectionReason && (
                <p className="text-xs text-red-700 mb-3">Rejected: {reservation.rejectionReason}</p>
            )}

            {/* Staff decision. The API only approves a Pending reservation and gives capacity back on reject. */}
            <div className="mb-3">
                <ReservationDecisionActions reservation={reservation} onDecided={onDecided} onError={onDecisionError} />
            </div>

            {/* Actions. Both are gated on the same notice and status rules. */}
            <div className="mt-auto">
                {!eligibility.allowed && ['Pending', 'Approved'].includes(reservation.status) && (
                    <p className="text-xs text-red-600 mb-2">{eligibility.reason}</p>
                )}

                {isConfirmingCancel ? (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <p className="text-sm text-red-800 mb-3">
                            Cancel {reservation.reservationNo}? Its reserved capacity is released back to the slot.
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={onAbortCancel}
                                disabled={isBusy}
                                className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
                            >
                                Keep booking
                            </button>
                            <button
                                onClick={onConfirmCancel}
                                disabled={isBusy}
                                className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                            >
                                {isBusy ? 'Cancelling…' : 'Confirm cancellation'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={onEdit}
                            disabled={!eligibility.allowed || isBusy}
                            title={eligibility.allowed ? 'Update this reservation' : eligibility.reason}
                            className="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                        >
                            Update
                        </button>
                        <button
                            onClick={onRequestCancel}
                            disabled={!eligibility.allowed || isBusy}
                            title={eligibility.allowed ? 'Cancel this reservation' : eligibility.reason}
                            className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                        >
                            Cancel Reservation
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// Label and value pair used inside a reservation card.
function Detail({ label, value, mono = false }) {
    return (
        <div>
            <span className="block text-gray-500 text-xs uppercase tracking-wider">{label}</span>
            <span className={`font-medium ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
        </div>
    );
}
