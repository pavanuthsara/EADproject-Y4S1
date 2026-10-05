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

// A dot is drawn per position up to this many; bigger slots show numbers only.
const MAX_BAY_DOTS = 12;

const VIEWS = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'past', label: 'Past' },
    { id: 'all', label: 'All' },
];

// The slots inside one node, drawn as battery cards.
//   Backoffice: add, edit and delete slots.
//   Backoffice and Grid Operator: open or close a slot, and view / decide on its bookings.
//
// Props:
//   node        - the station (battery)
//   canManage   - true for Backoffice (create / edit / delete)
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

    // Totals for the battery header: energy booked across the upcoming slots.
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
        <div className="border-t border-gray-100 pt-4 mt-2">
            {/* Battery header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div>
                    <h4 className="text-sm font-semibold text-gray-800">Booking slots</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Battery: {formatKwh(node.capacityKwh)} · {node.totalBays} bays
                        {upcomingTotals.count > 0 && (
                            <> · Upcoming: {upcomingTotals.count} slot(s), {formatKwh(upcomingTotals.reservedKwh)} of {formatKwh(upcomingTotals.capacityKwh)} booked</>
                        )}
                    </p>
                </div>
                {canManage && (
                    <button
                        type="button"
                        onClick={() => { setNotice(''); setFormSlot(null); }}
                        disabled={!nodeIsActive}
                        title={nodeIsActive ? 'Add a booking slot' : 'Activate the node to add slots'}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        + Add slot
                    </button>
                )}
            </div>

            <div className="flex gap-1 mb-3" role="tablist">
                {VIEWS.map((v) => (
                    <button
                        key={v.id}
                        type="button"
                        role="tab"
                        aria-selected={view === v.id}
                        onClick={() => setView(v.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${view === v.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        {v.label}
                    </button>
                ))}
            </div>

            {error && <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-3 text-sm text-red-700">{error}</div>}
            {notice && <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-3 text-sm text-green-800">{notice}</div>}

            {isLoading && (
                <div className="flex justify-center p-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div></div>
            )}

            {!isLoading && groups.length === 0 && !error && (
                <p className="text-sm text-gray-500 text-center py-6 bg-gray-50 rounded-md">
                    {slots.length === 0
                        ? (canManage ? 'No slots yet. Add one so prosumers can book this node.' : 'No slots have been added to this node yet.')
                        : `No ${view} slots.`}
                </p>
            )}

            <div className="space-y-4">
                {groups.map(([dayKey, daySlots]) => (
                    <div key={dayKey}>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{formatDayHeading(dayKey)}</p>
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
        <div className={`border rounded-lg p-4 bg-white ${isClosed ? 'border-gray-200 opacity-80' : 'border-gray-200'}`}>
            <div className="flex justify-between items-start mb-3">
                <p className="font-semibold text-gray-900">{formatTimeRange(slot)}</p>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${SLOT_STATUS_STYLES[slot.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {slot.status}
                </span>
            </div>

            {/* Battery bar: how much of the slot's energy is booked */}
            <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-5 rounded-md border-2 border-gray-300 p-0.5 bg-gray-50" aria-label={`${Math.round(percent)}% of the energy is booked`}>
                    <div className={`h-full rounded-sm transition-all ${batteryColor(percent, slot.status)}`} style={{ width: `${percent}%` }} />
                </div>
                <div className="w-1 h-2.5 bg-gray-300 rounded-r-sm -ml-1" aria-hidden="true" />
                <span className="text-xs font-medium text-gray-700 w-10 text-right">{Math.round(percent)}%</span>
            </div>
            <p className="text-xs text-gray-600 mb-3">
                {formatKwh(slot.reservedKwh)} booked of {formatKwh(slot.capacityKwh)} · {formatKwh(freeKwh)} free
            </p>

            {/* Bays: one dot per position */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
                {slot.totalPositions <= MAX_BAY_DOTS && (
                    <div className="flex gap-1" aria-hidden="true">
                        {Array.from({ length: slot.totalPositions }, (_, i) => (
                            <span key={i} className={`w-3 h-3 rounded-full ${i < slot.reservedPositions ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                        ))}
                    </div>
                )}
                <span className="text-xs text-gray-600">
                    {slot.reservedPositions} of {slot.totalPositions} bays booked · {freePositions} free
                </span>
            </div>

            <div className="flex gap-1.5 mb-3 flex-wrap">
                {slotDirections(slot).map((direction) => (
                    <span key={direction} className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-medium">
                        {DIRECTION_SHORT[direction] ?? direction}
                    </span>
                ))}
            </div>

            {isConfirmingDelete ? (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-800 mb-2">Delete this slot? This cannot be undone.</p>
                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={onAbortDelete} disabled={isBusy} className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50">Keep</button>
                        <button type="button" onClick={onConfirmDelete} disabled={isBusy} className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50">
                            {isBusy ? 'Deleting…' : 'Delete'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-wrap justify-end gap-1">
                    <button type="button" onClick={onViewBookings} className="text-indigo-600 hover:bg-indigo-50 px-2.5 py-1 rounded text-sm font-medium">
                        Bookings
                    </button>
                    <button type="button" onClick={onToggleOpen} disabled={isBusy} className="text-gray-700 hover:bg-gray-100 px-2.5 py-1 rounded text-sm font-medium disabled:opacity-50">
                        {isClosed ? 'Open' : 'Close'}
                    </button>
                    {canManage && (
                        <>
                            <button type="button" onClick={onEdit} disabled={isBusy} className="text-indigo-600 hover:bg-indigo-50 px-2.5 py-1 rounded text-sm font-medium disabled:opacity-50">
                                Edit
                            </button>
                            <button type="button" onClick={onRequestDelete} disabled={isBusy} className="text-red-600 hover:bg-red-50 px-2.5 py-1 rounded text-sm font-medium disabled:opacity-50">
                                Delete
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
