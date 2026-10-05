import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getNodeSlots, deleteSlot, setSlotAvailability } from '../../services/nodeService';
import SlotFormModal from './SlotFormModal';
import SlotBookingsDrawer from './SlotBookingsDrawer';
import {
    SLOT_STATUS_STYLES,
    DIRECTION_SHORT,
    slotDirections,
    localDayKey,
    formatDayHeading,
    formatTimeRange,
    bookedPercent,
    batteryColor,
    formatKwh,
} from '../../utils/slotUtils';

const MAX_BAY_DOTS = 12;

const VIEWS = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'past', label: 'Past' },
    { id: 'all', label: 'All' },
];

export default function SlotManager({ node, canManage }) {
    const [slots, setSlots] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [view, setView] = useState('upcoming');

    const [formSlot, setFormSlot] = useState(undefined); // undefined = closed, null = new slot, object = edit
    const [bookingsSlot, setBookingsSlot] = useState(null);
    const [pendingDeleteId, setPendingDeleteId] = useState(null);
    const [busySlotId, setBusySlotId] = useState(null);

    const nodeIsActive = node.status === 'Active';

    // Loads the hub's booking slots.
    const load = useCallback(async () => {
        try {
            setSlots(await getNodeSlots(node.id));
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to load the slots for this node.');
        } finally {
            setIsLoading(false);
        }
    }, [node.id]);

    useEffect(() => {
        load();
    }, [load]);

    const now = Date.now();

    const visibleSlots = useMemo(() => {
        const sorted = [...slots].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        if (view === 'upcoming') return sorted.filter((s) => new Date(s.endTime).getTime() > now);
        if (view === 'past') return sorted.filter((s) => new Date(s.endTime).getTime() <= now).reverse();
        return sorted;
    }, [slots, view]);

    const groups = useMemo(() => {
        const byDay = new Map();
        for (const slot of visibleSlots) {
            const key = localDayKey(slot.startTime);
            if (!byDay.has(key)) byDay.set(key, []);
            byDay.get(key).push(slot);
        }
        return [...byDay.entries()];
    }, [visibleSlots]);

    const upcomingTotals = useMemo(() => {
        const upcoming = slots.filter((s) => new Date(s.endTime).getTime() > now && s.status !== 'Closed');
        return {
            count: upcoming.length,
            reservedKwh: upcoming.reduce((sum, s) => sum + s.reservedKwh, 0),
            capacityKwh: upcoming.reduce((sum, s) => sum + s.capacityKwh, 0),
        };
    }, [slots]);

    // Closes the slot form after a save and reloads the slots.
    const handleSaved = async () => {
        const wasEdit = Boolean(formSlot);
        setFormSlot(undefined);
        setNotice(wasEdit ? 'Slot updated.' : 'Slot added.');
        await load();
    };

    // Opens or closes a slot to new bookings.
    const handleToggleOpen = async (slot) => {
        const open = slot.status === 'Closed';
        setBusySlotId(slot.id);
        setError('');
        setNotice('');
        try {
            await setSlotAvailability(node.id, slot.id, open);
            setNotice(open ? 'Slot opened for bookings.' : 'Slot closed to new bookings. Existing bookings are not affected.');
            await load();
        } catch (err) {
            setError(err.message || 'Could not change the slot availability.');
        } finally {
            setBusySlotId(null);
        }
    };

    // Deletes a slot after the user confirms.
    const handleDelete = async (slot) => {
        setBusySlotId(slot.id);
        setError('');
        setNotice('');
        try {
            await deleteSlot(node.id, slot.id);
            setPendingDeleteId(null);
            setNotice('Slot deleted.');
            await load();
        } catch (err) {
            setError(err.message || 'Could not delete the slot.');
            setPendingDeleteId(null);
        } finally {
            setBusySlotId(null);
        }
    };

    return (
        <div className="bg-slate-50/50 rounded-2xl p-4 sm:p-5 border border-slate-200">
            {/* Battery header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>🔋 Trading Windows & Energy Slots</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Battery: <strong className="text-slate-800">{formatKwh(node.capacityKwh)}</strong> · <strong className="text-slate-800">{node.totalBays}</strong> bays
                        {upcomingTotals.count > 0 && (
                            <span className="text-emerald-700 ml-1">
                                · Upcoming: {upcomingTotals.count} active, {formatKwh(upcomingTotals.reservedKwh)} booked
                            </span>
                        )}
                    </p>
                </div>
                {canManage && (
                    <button
                        type="button"
                        onClick={() => { setNotice(''); setFormSlot(null); }}
                        disabled={!nodeIsActive}
                        title={nodeIsActive ? 'Add a booking slot' : 'Activate the node to add slots'}
                        className="bg-[#10B981] hover:bg-[#059669] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-xs transition-all cursor-pointer"
                    >
                        + Add Time Slot
                    </button>
                )}
            </div>

            <div className="flex gap-1.5 mb-4" role="tablist">
                {VIEWS.map((v) => (
                    <button
                        key={v.id}
                        type="button"
                        role="tab"
                        aria-selected={view === v.id}
                        onClick={() => setView(v.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            view === v.id 
                                ? 'bg-slate-900 text-white shadow-xs' 
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                    >
                        {v.label}
                    </button>
                ))}
            </div>

            {error && <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-3 text-xs text-red-700 rounded-r-lg font-medium">{error}</div>}
            {notice && <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 mb-3 text-xs text-emerald-800 rounded-r-lg font-medium">{notice}</div>}

            {isLoading && (
                <div className="flex justify-center p-6"><div className="animate-spin rounded-full h-6 w-6 border-2 border-[#F59E0B] border-t-transparent"></div></div>
            )}

            {!isLoading && groups.length === 0 && !error && (
                <p className="text-xs text-slate-500 text-center py-8 bg-white border border-dashed border-slate-200 rounded-xl">
                    {slots.length === 0
                        ? (canManage ? 'No energy slots registered yet. Add one to open reservations.' : 'No slots configured for this node yet.')
                        : `No ${view} slots found.`}
                </p>
            )}

            <div className="space-y-4">
                {groups.map(([dayKey, daySlots]) => (
                    <div key={dayKey}>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span>
                            {formatDayHeading(dayKey)}
                        </p>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                            {daySlots.map((slot) => (
                                <SlotCard
                                    key={slot.id}
                                    slot={slot}
                                    canManage={canManage}
                                    isBusy={busySlotId === slot.id}
                                    isConfirmingDelete={pendingDeleteId === slot.id}
                                    onEdit={() => { setNotice(''); setFormSlot(slot); }}
                                    onToggleOpen={() => handleToggleOpen(slot)}
                                    onViewBookings={() => setBookingsSlot(slot)}
                                    onRequestDelete={() => { setError(''); setNotice(''); setPendingDeleteId(slot.id); }}
                                    onAbortDelete={() => setPendingDeleteId(null)}
                                    onConfirmDelete={() => handleDelete(slot)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {formSlot !== undefined && (
                <SlotFormModal
                    node={node}
                    slot={formSlot}
                    onClose={() => setFormSlot(undefined)}
                    onSaved={handleSaved}
                />
            )}

            {bookingsSlot && (
                <SlotBookingsDrawer
                    slot={bookingsSlot}
                    onClose={() => setBookingsSlot(null)}
                    onChanged={load}
                />
            )}
        </div>
    );
}

// Card for one slot: time, capacity used and the manage actions.
function SlotCard({
    slot, canManage, isBusy, isConfirmingDelete,
    onEdit, onToggleOpen, onViewBookings, onRequestDelete, onAbortDelete, onConfirmDelete,
}) {
    const percent = bookedPercent(slot);
    const freePositions = Math.max(0, slot.totalPositions - slot.reservedPositions);
    const freeKwh = Math.max(0, slot.capacityKwh - slot.reservedKwh);
    const isClosed = slot.status === 'Closed';

    return (
        <div className={`border rounded-xl p-4 bg-white transition-all shadow-xs ${
            isClosed ? 'border-slate-200 opacity-75' : 'border-slate-200 hover:border-slate-300'
        }`}>
            <div className="flex justify-between items-start mb-2.5">
                <p className="font-bold text-xs sm:text-sm text-slate-900 font-mono">{formatTimeRange(slot)}</p>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${SLOT_STATUS_STYLES[slot.status] ?? 'bg-slate-100 text-slate-700'}`}>
                    {slot.status}
                </span>
            </div>

            {/* Battery bar: how much of the slot's energy is booked */}
            <div className="flex items-center gap-2 mb-1.5">
                <div className="flex-1 h-4 rounded-md border border-slate-200 p-0.5 bg-slate-100" aria-label={`${Math.round(percent)}% of the energy is booked`}>
                    <div className={`h-full rounded-xs transition-all ${batteryColor(percent, slot.status)}`} style={{ width: `${percent}%` }} />
                </div>
                <div className="w-1 h-2 bg-slate-300 rounded-r-xs -ml-1.5" aria-hidden="true" />
                <span className="text-[11px] font-bold text-slate-700 w-10 text-right">{Math.round(percent)}%</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2.5 font-medium">
                {formatKwh(slot.reservedKwh)} booked of {formatKwh(slot.capacityKwh)} · <strong className="text-emerald-700">{formatKwh(freeKwh)} available</strong>
            </p>

            {/* Bays: one dot per position */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
                {slot.totalPositions <= MAX_BAY_DOTS && (
                    <div className="flex gap-1" aria-hidden="true">
                        {Array.from({ length: slot.totalPositions }, (_, i) => (
                            <span key={i} className={`w-2.5 h-2.5 rounded-full ${i < slot.reservedPositions ? 'bg-[#F59E0B]' : 'bg-slate-200'}`} />
                        ))}
                    </div>
                )}
                <span className="text-[11px] text-slate-600 font-medium">
                    {slot.reservedPositions} of {slot.totalPositions} bays booked · {freePositions} free
                </span>
            </div>

            <div className="flex gap-1.5 mb-3 flex-wrap">
                {slotDirections(slot).map((direction) => (
                    <span key={direction} className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                        {DIRECTION_SHORT[direction] ?? direction}
                    </span>
                ))}
            </div>

            {isConfirmingDelete ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="text-xs font-semibold text-red-800 mb-2">Delete this slot permanently?</p>
                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={onAbortDelete} disabled={isBusy} className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50">Keep</button>
                        <button type="button" onClick={onConfirmDelete} disabled={isBusy} className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 disabled:opacity-50">
                            {isBusy ? 'Deleting…' : 'Confirm'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-wrap justify-end gap-1.5 pt-2 border-t border-slate-100">
                    <button 
                        type="button" 
                        onClick={onViewBookings} 
                        className="text-emerald-700 hover:bg-emerald-50 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                        View Bookings
                    </button>
                    <button 
                        type="button" 
                        onClick={onToggleOpen} 
                        disabled={isBusy} 
                        className="text-slate-700 hover:bg-slate-100 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                    >
                        {isClosed ? 'Open Slot' : 'Close Slot'}
                    </button>
                    {canManage && (
                        <>
                            <button 
                                type="button" 
                                onClick={onEdit} 
                                disabled={isBusy} 
                                className="text-amber-700 hover:bg-amber-50 px-2.5 py-1 rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                            >
                                Edit
                            </button>
                            <button 
                                type="button" 
                                onClick={onRequestDelete} 
                                disabled={isBusy} 
                                className="text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                            >
                                Delete
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
