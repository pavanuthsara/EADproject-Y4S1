import React, { useState } from 'react';
import { createSlot, updateSlot } from '../../services/nodeService';
import { toLocalInputValue, fromLocalInputValue } from '../../utils/reservationRules';
import { DIRECTION_LABELS } from '../../utils/slotUtils';

const DIRECTIONS = ['Inject', 'Draw'];
const ONE_HOUR_MS = 60 * 60 * 1000;

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => {
            const next = { ...prev, [name]: value };
            if (name === 'start' && value && (!prev.end || new Date(prev.end) <= new Date(value))) {
                next.end = toLocalInputValue(new Date(new Date(value).getTime() + ONE_HOUR_MS));
            }
            return next;
        });
    };

    const toggleDirection = (direction) => {
        setForm((prev) => ({
            ...prev,
            directions: prev.directions.includes(direction)
                ? prev.directions.filter((d) => d !== direction)
                : [...prev.directions, direction],
        }));
    };

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

    const inputClass = 'w-full border-slate-200 rounded-xl border p-2.5 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F59E0B] disabled:bg-slate-100 disabled:text-slate-400';
    const minPositions = isEdit ? Math.max(1, slot.reservedPositions) : 1;
    const minKwh = isEdit && slot.reservedKwh > 0 ? slot.reservedKwh : 0.01;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4" role="dialog" aria-modal="true">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-200">
                <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex justify-between items-center">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">{isEdit ? 'Edit Energy Slot' : 'Add Time Slot'}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {node.stationName} (Max: {node.capacityKwh} kWh, {node.totalBays} bays)
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                </div>

                <div className="p-5 space-y-4">
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg">
                            <p className="text-xs text-red-700 font-semibold">{error}</p>
                        </div>
                    )}

                    {hasBookings && (
                        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
                            This slot has {slot.reservedPositions} active booking(s). Times are locked to preserve user reservations.
                        </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="slot-start" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Starts (Local)</label>
                            <input id="slot-start" required type="datetime-local" name="start" value={form.start} onChange={handleChange} disabled={hasBookings} className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="slot-end" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Ends (Local)</label>
                            <input id="slot-end" required type="datetime-local" name="end" value={form.end} onChange={handleChange} disabled={hasBookings} className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="slot-positions" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Positions <span className="text-slate-400 lowercase font-normal">(max {node.totalBays})</span>
                            </label>
                            <input id="slot-positions" required type="number" name="totalPositions" min={minPositions} max={node.totalBays} step="1" value={form.totalPositions} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="slot-kwh" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Capacity kWh <span className="text-slate-400 lowercase font-normal">(max {node.capacityKwh})</span>
                            </label>
                            <input id="slot-kwh" required type="number" name="capacityKwh" min={minKwh} max={node.capacityKwh} step="any" value={form.capacityKwh} onChange={handleChange} className={inputClass} placeholder="e.g. 25" />
                        </div>
                    </div>

                    <fieldset>
                        <legend className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Allowed Trading Directions</legend>
                        <div className="flex flex-col sm:flex-row gap-2.5">
                            {DIRECTIONS.map((direction) => (
                                <label key={direction} className={`flex items-center gap-2 text-xs font-semibold border rounded-xl px-3 py-2 cursor-pointer transition-all ${
                                    form.directions.includes(direction) 
                                        ? 'bg-amber-50 border-amber-300 text-amber-900' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}>
                                    <input
                                        type="checkbox"
                                        checked={form.directions.includes(direction)}
                                        onChange={() => toggleDirection(direction)}
                                        className="accent-[#F59E0B]"
                                    />
                                    {DIRECTION_LABELS[direction]}
                                </label>
                            ))}
                        </div>
                    </fieldset>
                </div>

                <div className="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50/50">
                    <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50">
                        Cancel
                    </button>
                    <button type="submit" disabled={isSaving} className="px-5 py-2 bg-[#F59E0B] text-slate-950 font-bold rounded-xl text-xs hover:bg-[#d97706] shadow-xs disabled:opacity-50">
                        {isSaving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Slot'}
                    </button>
                </div>
            </form>
        </div>
    );
}
