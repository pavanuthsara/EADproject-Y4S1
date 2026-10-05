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

const CLOCK_TICK_MS = 30_000;

const STATUS_STYLES = {
    Pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    Approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    Rejected: 'bg-rose-50 text-rose-700 border border-rose-200',
    Completed: 'bg-sky-50 text-sky-700 border border-sky-200',
    Cancelled: 'bg-slate-100 text-slate-600 border border-slate-200',
};

const NOTICE_STYLES = {
    ok: 'text-emerald-700',
    warning: 'text-amber-700',
    expired: 'text-rose-700',
    neutral: 'text-slate-500',
};

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

    useEffect(() => {
        let cancelled = false;
        getSlots(form.stationId)
            .then((data) => { if (!cancelled) setSlots(data); })
            .catch(() => { if (!cancelled) setError('Failed to load booking slots for this node.'); });

        return () => { cancelled = true; };
    }, [form.stationId]);

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

    const resetPanel = useCallback(() => {
        setMode(null);
        setEditingId(null);
        setForm(EMPTY_FORM);
        setFieldErrors({});
    }, []);

    const openCreate = () => {
        setError('');
        setSummary('');
        setFieldErrors({});
        setEditingId(null);
        setForm(EMPTY_FORM);
        setMode('create');
    };

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

    const handleFieldChange = (event) => {
        const { name, value } = event.target;

        setForm((prev) => {
            const next = { ...prev, [name]: value };

            if (name === 'stationId') next.slotId = '';

            if (name === 'slotId') {
                const allowed = directionsForSlot(slots.find((s) => s.id === value));
                if (!allowed.includes(next.direction)) next.direction = allowed[0];
            }

            return next;
        });
        setFieldErrors((prev) => ({ ...prev, [name]: undefined, direction: undefined, form: undefined }));
    };

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

    const handleUpdateSubmit = async (event) => {
        event.preventDefault();
        if (!editingReservation) return;

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

    const handleDecided = async (updated) => {
        setError('');
        setSummary(`${updated.reservationNo} — ${updated.message}`);
        await loadAll();
    };

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
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
                <div className="w-10 h-10 border-4 border-[#F59E0B] border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm font-medium text-slate-500">Loading Power Trading Reservations...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:justify-between md:items-center bg-slate-50/80 gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                        <h2 className="text-xl font-bold text-slate-900">Power Trading Reservations</h2>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Dispatch approvals, monitor injection/drawing quotas, and resolve trading requests.
                    </p>
                </div>
                <button
                    onClick={mode === 'create' ? resetPanel : openCreate}
                    className="inline-flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#d97706] text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all transform active:scale-95 whitespace-nowrap cursor-pointer"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                    {mode === 'create' ? 'Close Form' : 'New Reservation'}
                </button>
            </div>

            {/* Policy notice banner */}
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3.5 grid gap-3 md:grid-cols-2 text-xs font-medium">
                <p className="text-amber-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
                    <span><strong className="font-bold">{policy.bookingWindowDays}-Day Window Rule:</strong> Slots must start before {formatDateTime(windowBounds.latest)}.</span>
                </p>
                <p className="text-amber-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                    <span><strong className="font-bold">{policy.minimumNoticeHours}-Hour Lockout:</strong> Modifications freeze {policy.minimumNoticeHours}h before scheduled slot.</span>
                </p>
            </div>

            {/* Counts */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 border-b border-slate-200 bg-white">
                <SummaryTile label="Total Reservations" value={counts.total} />
                <SummaryTile label="Pending Review" value={counts.pending} tone="amber" />
                <SummaryTile label="Approved & Active" value={counts.approvedFuture} tone="green" />
                <SummaryTile label="Locked By Notice" value={counts.locked} tone="red" />
            </div>

            {/* Action summary / error */}
            {summary && (
                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 mx-6 mt-6 rounded-r-xl">
                    <p className="text-emerald-800 text-xs sm:text-sm font-semibold">{summary}</p>
                </div>
            )}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-6 mt-6 rounded-r-xl">
                    <p className="text-red-700 text-xs sm:text-sm font-semibold">{error}</p>
                </div>
            )}

            {/* Create / Update form */}
            {mode && (
                <div className="p-6 border-b border-slate-200 bg-amber-50/20">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900">
                                {mode === 'create' ? 'Create Power Reservation' : `Update Reservation ${editingReservation?.reservationNo ?? ''}`}
                            </h3>
                        </div>
                        <button 
                            onClick={resetPanel} 
                            className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                            ✕ Cancel
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                        {mode === 'create'
                            ? `Only microgrid slots within the next ${policy.bookingWindowDays} days are eligible for booking.`
                            : `Parameters can be modified until lock deadline: ${formatDateTime(noticeDeadline(editingReservation?.slotStartUtc, policy))}.`}
                    </p>

                    {fieldErrors.form && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                            <p className="text-red-700 text-xs font-semibold">{fieldErrors.form}</p>
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
                                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs sm:text-sm disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                            />
                        </Field>

                        <Field label="Microgrid Node" error={fieldErrors.stationId}>
                            <select
                                name="stationId"
                                value={form.stationId}
                                onChange={handleFieldChange}
                                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                            >
                                <option value="">Select a node…</option>
                                {stations.map((station) => (
                                    <option key={station.id} value={station.id}>
                                        {station.stationName} ({station.city})
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
                                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs sm:text-sm bg-white disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                            >
                                <option value="">
                                    {form.stationId ? 'Select an active slot…' : 'Choose a node first'}
                                </option>
                                {slots.map((slot) => {
                                    const info = describeSlot(slot, now, policy);
                                    const isCurrent = mode === 'update' && slot.id === editingReservation?.slotId;
                                    return (
                                        <option
                                            key={slot.id}
                                            value={slot.id}
                                            disabled={!info.selectable && !isCurrent}
                                        >
                                            {formatDateTime(slot.startTime)}
                                            {isCurrent ? ' (Current)' : ''}
                                            {` · ${info.note}`}
                                        </option>
                                    );
                                })}
                            </select>
                        </Field>

                        <Field label="Trading Direction" error={fieldErrors.direction}>
                            <select
                                name="direction"
                                value={form.direction}
                                onChange={handleFieldChange}
                                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                            >
                                {allowedDirections.map((direction) => (
                                    <option key={direction} value={direction}>{direction === 'Inject' ? 'Inject (Feed to Microgrid)' : 'Draw (Consume from Hub)'}</option>
                                ))}
                            </select>
                            {selectedSlot && selectedSlot.supportedDirections.length > 0 && (
                                <p className="text-[10px] text-slate-500 mt-1">
                                    Slot limits: {selectedSlot.supportedDirections.join(' & ')}.
                                </p>
                            )}
                        </Field>

                        <Field label="Energy Volume (kWh)" error={fieldErrors.requestedKwh}>
                            <input
                                type="number"
                                name="requestedKwh"
                                value={form.requestedKwh}
                                onChange={handleFieldChange}
                                min="0.001"
                                step="0.5"
                                placeholder="e.g. 10"
                                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                            />
                            {selectedSlot && (
                                <p className="text-[10px] text-slate-500 mt-1 font-semibold text-emerald-700">
                                    {Number((selectedSlot.capacityKwh - selectedSlot.reservedKwh).toFixed(3))} kWh free on this slot.
                                </p>
                            )}
                        </Field>

                        <div className="flex items-end gap-2.5">
                            <button
                                type="button"
                                onClick={resetPanel}
                                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !validation.valid}
                                className="flex-1 px-4 py-2.5 bg-[#F59E0B] text-slate-950 font-bold rounded-xl text-xs hover:bg-[#d97706] shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isSubmitting
                                    ? 'Saving…'
                                    : mode === 'create' ? 'Confirm Reservation' : 'Update Reservation'}
                            </button>
                        </div>
                    </form>

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
            <div className="p-6 border-b border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50">
                <Field label="Filter by Status">
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl p-2 text-xs sm:text-sm bg-white"
                    >
                        <option value="All">All statuses</option>
                        {RESERVATION_STATUSES.map((status) => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </Field>
                <Field label="Filter by Microgrid Hub">
                    <select
                        value={filters.stationId}
                        onChange={(e) => setFilters((p) => ({ ...p, stationId: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl p-2 text-xs sm:text-sm bg-white"
                    >
                        <option value="All">All Hubs</option>
                        {stations.map((station) => (
                            <option key={station.id} value={station.id}>{station.stationName}</option>
                        ))}
                    </select>
                </Field>
                <Field label="Search by Prosumer NIC">
                    <input
                        type="text"
                        value={filters.nic}
                        onChange={(e) => setFilters((p) => ({ ...p, nic: e.target.value }))}
                        placeholder="Enter NIC number…"
                        className="w-full border border-slate-200 rounded-xl p-2 text-xs sm:text-sm bg-white"
                    />
                </Field>
            </div>

            {/* Reservation cards grid */}
            <div className="p-6">
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
                        <div className="col-span-full p-12 text-center text-slate-500 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                            <p className="font-semibold text-slate-800">No reservations found</p>
                            <p className="text-xs text-slate-400 mt-1">
                                {reservations.length === 0
                                    ? 'No reservations exist in the database yet.'
                                    : 'Adjust filters to view other bookings.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function SummaryTile({ label, value, tone = 'slate' }) {
    const tones = {
        slate: 'text-slate-900',
        amber: 'text-amber-600',
        green: 'text-emerald-600',
        red: 'text-rose-600',
    };

    return (
        <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <p className={`text-2xl font-black mt-1 ${tones[tone]}`}>{value}</p>
        </div>
    );
}

function Field({ label, error, children }) {
    return (
        <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">{label}</label>
            {children}
            {error && <p className="text-[11px] text-red-600 font-semibold mt-1">{error}</p>}
        </div>
    );
}

function SlotRuleCheck({ slot, reservation, now, policy }) {
    const startCheck = validateSlotStart(slot.startTime, now, policy);
    const hours = hoursUntil(slot.startTime, now);

    const checks = [
        {
            label: `Within ${policy.bookingWindowDays}-day rule`,
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
            label: `Minimum ${policy.minimumNoticeHours}h notice rule`,
            passed: eligibility.allowed,
            detail: eligibility.allowed ? notice.label : eligibility.reason,
        });
    }

    return (
        <div className="mt-4 border-t border-slate-200 pt-3 space-y-1.5">
            {checks.map((check) => (
                <p key={check.label} className="text-xs flex items-center gap-2">
                    <span className={`font-bold ${check.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {check.passed ? '✓' : '✗'}
                    </span>
                    <span className="text-slate-700">
                        <strong className="font-semibold">{check.label}</strong>
                        <span className="text-slate-500"> — {check.detail}</span>
                    </span>
                </p>
            ))}
        </div>
    );
}

function ReservationCard({
    reservation, now, policy, isBusy, isConfirmingCancel,
    onEdit, onRequestCancel, onAbortCancel, onConfirmCancel, onDecided, onDecisionError,
}) {
    const eligibility = evaluateChangeEligibility(reservation, now, policy);
    const notice = describeNotice(reservation, now, policy);
    const deadline = noticeDeadline(reservation.slotStartUtc, policy);

    return (
        <div className="border border-slate-200 rounded-2xl p-5 shadow-xs bg-white hover:shadow-md transition-all flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 font-mono">{reservation.reservationNo}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">NIC: <strong className="text-slate-800">{reservation.prosumerNic}</strong></p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[reservation.status]}`}>
                    {reservation.status}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <Detail label="Station Node" value={reservation.stationName} />
                <Detail 
                    label="Trading Flow" 
                    value={
                        <span className={`inline-flex items-center gap-1 font-bold ${
                            reservation.direction === 'Inject' ? 'text-emerald-700' : 'text-amber-700'
                        }`}>
                            {reservation.direction === 'Inject' ? '⚡ Inject (Feed)' : '🔌 Draw (Use)'}
                        </span>
                    } 
                />
                <Detail label="Reserved Quota" value={<strong className="text-slate-900 font-bold">{reservation.requestedKwh} kWh</strong>} />
                <Detail label="Slot ID" value={reservation.slotId} mono />
            </div>

            <div className="border-t border-slate-100 pt-3 mb-3 space-y-1">
                <p className="text-xs text-slate-800 font-medium">
                    <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Operating Period</span>
                    ⏰ {formatDateTime(reservation.slotStartUtc)} → {formatDateTime(reservation.slotEndUtc)}
                </p>
                <p className={`text-xs font-bold ${NOTICE_STYLES[notice.tone]}`}>{notice.label}</p>
                {deadline && ['Pending', 'Approved'].includes(reservation.status) && (
                    <p className="text-[11px] text-slate-400">
                        Notice deadline: {formatDateTime(deadline)}
                    </p>
                )}
            </div>

            {reservation.status === 'Rejected' && reservation.rejectionReason && (
                <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl mb-3 text-xs text-rose-800 font-medium">
                    Rejection note: {reservation.rejectionReason}
                </div>
            )}

            {/* Staff decision actions */}
            <div className="mb-3">
                <ReservationDecisionActions reservation={reservation} onDecided={onDecided} onError={onDecisionError} />
            </div>

            {/* Card actions */}
            <div className="mt-auto pt-2 border-t border-slate-100">
                {!eligibility.allowed && ['Pending', 'Approved'].includes(reservation.status) && (
                    <p className="text-[11px] text-rose-600 font-semibold mb-2">{eligibility.reason}</p>
                )}

                {isConfirmingCancel ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-xs font-semibold text-red-800 mb-2">
                            Cancel {reservation.reservationNo}? Reserved kWh will be returned to the slot pool.
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={onAbortCancel}
                                disabled={isBusy}
                                className="px-3 py-1 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
                            >
                                Keep
                            </button>
                            <button
                                onClick={onConfirmCancel}
                                disabled={isBusy}
                                className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 disabled:opacity-50"
                            >
                                {isBusy ? 'Cancelling…' : 'Cancel Reservation'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={onEdit}
                            disabled={!eligibility.allowed || isBusy}
                            title={eligibility.allowed ? 'Update this reservation' : eligibility.reason}
                            className="text-amber-700 hover:bg-amber-50 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors disabled:text-slate-400 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"
                        >
                            Modify
                        </button>
                        <button
                            onClick={onRequestCancel}
                            disabled={!eligibility.allowed || isBusy}
                            title={eligibility.allowed ? 'Cancel this reservation' : eligibility.reason}
                            className="text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors disabled:text-slate-400 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function Detail({ label, value, mono = false }) {
    return (
        <div>
            <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">{label}</span>
            <span className={`text-xs ${mono ? 'font-mono text-slate-600' : 'text-slate-800'}`}>{value}</span>
        </div>
    );
}
