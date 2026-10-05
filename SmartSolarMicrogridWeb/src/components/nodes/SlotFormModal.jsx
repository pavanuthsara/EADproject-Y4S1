import React, { useState } from 'react';
import { createSlot, updateSlot } from '../../services/nodeService';
import { toLocalInputValue, fromLocalInputValue } from '../../utils/reservationRules';
import { DIRECTION_LABELS } from '../../utils/slotUtils';

const DIRECTIONS = ['Inject', 'Draw'];
const ONE_HOUR_MS = 60 * 60 * 1000;

// Create or edit a booking slot inside a node. The node is the battery, so positions and
// kWh are limited by the node. The API checks every rule again; this form only helps.
//
// Props:
//   node   - the station (battery) the slot belongs to
//   slot   - the slot being edited, or null to create a new one
//   onClose()  - close without saving
//   onSaved()  - called after the API accepted the slot
export default function SlotFormModal({ node, slot, onClose, onSaved }) {
    const isEdit = Boolean(slot);
    const hasBookings = isEdit && slot.reservedPositions > 0;

    const [form, setForm] = useState(() => ({
        start: slot ? toLocalInputValue(slot.startTime) : '',
        end: slot ? toLocalInputValue(slot.endTime) : '',
        totalPositions: slot ? String(slot.totalPositions) : '1',
        capacityKwh: slot ? String(slot.capacityKwh) : '',
        directions: slot?.supportedDirections?.length ? slot.supportedDirections : [...DIRECTIONS],
    }));
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Updates a form field, suggesting a one-hour end time when the start is picked.
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => {
            const next = { ...prev, [name]: value };
            // Convenience: suggest a one hour slot when the start is picked.
            if (name === 'start' && value && (!prev.end || new Date(prev.end) <= new Date(value))) {
                next.end = toLocalInputValue(new Date(new Date(value).getTime() + ONE_HOUR_MS));
            }
            return next;
        });
    };

    // Adds or removes an energy direction the slot accepts.
    const toggleDirection = (direction) => {
        setForm((prev) => ({
            ...prev,
            directions: prev.directions.includes(direction)
                ? prev.directions.filter((d) => d !== direction)
                : [...prev.directions, direction],
        }));
    };

    // Validates the times and creates or updates the slot.
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const startTime = fromLocalInputValue(form.start);
        const endTime = fromLocalInputValue(form.end);
        if (!startTime || !endTime) {
            setError('Choose a start and an end time.');
            return;
        }
        if (new Date(endTime) <= new Date(startTime)) {
            setError('The end time must be after the start time.');
            return;
        }
        if (form.directions.length === 0) {
            setError('Choose at least one direction.');
            return;
        }

        const body = {
            startTime,
            endTime,
            totalPositions: Number(form.totalPositions),
            capacityKwh: Number(form.capacityKwh),
            supportedDirections: DIRECTIONS.filter((d) => form.directions.includes(d)),
        };

        setIsSaving(true);
        try {
            if (isEdit) {
                await updateSlot(node.id, slot.id, body);
            } else {
                await createSlot(node.id, body);
            }
            onSaved();
        } catch (err) {
            setError(err.message || 'The slot could not be saved.');
        } finally {
            setIsSaving(false);
        }
    };

    const inputClass = 'w-full border-gray-300 rounded-md border p-2 disabled:bg-gray-100 disabled:text-gray-500';
    const minPositions = isEdit ? Math.max(1, slot.reservedPositions) : 1;
    const minKwh = isEdit && slot.reservedKwh > 0 ? slot.reservedKwh : 0.01;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-5 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">{isEdit ? 'Edit slot' : 'Add slot'}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {node.stationName}: battery of {node.capacityKwh} kWh with {node.totalBays} bays. A slot cannot go above these limits.
                    </p>
                </div>

                <div className="p-5 space-y-4">
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {hasBookings && (
                        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3">
                            This slot has {slot.reservedPositions} booking position(s), so its time cannot change. Positions and kWh cannot go below what is booked.
                        </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="slot-start" className="block text-sm font-medium text-gray-700 mb-1">Starts</label>
                            <input id="slot-start" required type="datetime-local" name="start" value={form.start} onChange={handleChange} disabled={hasBookings} className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="slot-end" className="block text-sm font-medium text-gray-700 mb-1">Ends</label>
                            <input id="slot-end" required type="datetime-local" name="end" value={form.end} onChange={handleChange} disabled={hasBookings} className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="slot-positions" className="block text-sm font-medium text-gray-700 mb-1">
                                Positions <span className="text-gray-400 font-normal">(max {node.totalBays})</span>
                            </label>
                            <input id="slot-positions" required type="number" name="totalPositions" min={minPositions} max={node.totalBays} step="1" value={form.totalPositions} onChange={handleChange} className={inputClass} />
                            <p className="text-xs text-gray-500 mt-1">How many prosumers can book this slot at the same time.</p>
                        </div>
                        <div>
                            <label htmlFor="slot-kwh" className="block text-sm font-medium text-gray-700 mb-1">
                                Capacity kWh <span className="text-gray-400 font-normal">(max {node.capacityKwh})</span>
                            </label>
                            <input id="slot-kwh" required type="number" name="capacityKwh" min={minKwh} max={node.capacityKwh} step="any" value={form.capacityKwh} onChange={handleChange} className={inputClass} placeholder="e.g. 50" />
                            <p className="text-xs text-gray-500 mt-1">Total energy this slot can handle.</p>
                        </div>
                    </div>

                    <fieldset>
                        <legend className="block text-sm font-medium text-gray-700 mb-2">Allowed directions</legend>
                        <div className="flex flex-col sm:flex-row gap-3">
                            {DIRECTIONS.map((direction) => (
                                <label key={direction} className="flex items-center gap-2 text-sm text-gray-800 border border-gray-200 rounded-md px-3 py-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.directions.includes(direction)}
                                        onChange={() => toggleDirection(direction)}
                                    />
                                    {DIRECTION_LABELS[direction]}
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    <p className="text-xs text-gray-500">Times are shown in your local time zone and saved as UTC.</p>
                </div>

                <div className="p-5 border-t border-gray-200 flex justify-end gap-2">
                    <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                        Cancel
                    </button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
                        {isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Add slot'}
                    </button>
                </div>
            </form>
        </div>
    );
}
