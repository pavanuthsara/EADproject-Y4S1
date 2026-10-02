import React, { useEffect, useRef } from 'react';

// Operating schedule picker. Emits the "HH:mm-HH:mm" (24h) string the hub
// registration payload expects, so no manual formatting is left to the user.

const pad = (n) => String(n).padStart(2, '0');
const HOURS = Array.from({ length: 24 }, (_, i) => pad(i));
const MINUTES = ['00', '15', '30', '45'];
const DEFAULT_RANGE = { start: '06:00', end: '18:00' };

const PRESETS = [
    { label: 'Daylight', value: '06:00-18:00' },
    { label: 'Peak Sun', value: '09:00-15:00' },
    { label: 'Extended', value: '05:00-20:00' },
];

function parseTimeRange(value) {
    const match = /^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/.exec(value ?? '');
    return match ? { start: `${match[1]}:${match[2]}`, end: `${match[3]}:${match[4]}` } : null;
}

const toMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

function formatDuration(totalMinutes) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function TimeSelect({ label, time, onChange, hourRef }) {
    const [hour, minute] = time.split(':');
    // Keep an off-grid minute (e.g. from a preset or prior value) selectable.
    const minuteOptions = MINUTES.includes(minute) ? MINUTES : [...MINUTES, minute].sort();
    const selectClass = 'border border-gray-300 rounded-md bg-white p-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';

    return (
        <div>
            <span className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">{label}</span>
            <div className="flex items-center gap-1">
                <select ref={hourRef} aria-label={`${label} hour`} value={hour} onChange={(e) => onChange(`${e.target.value}:${minute}`)} className={selectClass}>
                    {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <span className="font-semibold text-gray-500">:</span>
                <select aria-label={`${label} minute`} value={minute} onChange={(e) => onChange(`${hour}:${e.target.value}`)} className={selectClass}>
                    {minuteOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>
        </div>
    );
}

export default function TimeRangePicker({ value, onChange }) {
    const { start, end } = parseTimeRange(value) ?? DEFAULT_RANGE;
    const duration = toMinutes(end) - toMinutes(start);
    const isValid = duration > 0;
    const endHourRef = useRef(null);

    // Surface the error through native form validation so the form can't submit an inverted window.
    useEffect(() => {
        endHourRef.current?.setCustomValidity(isValid ? '' : 'End time must be after start time.');
    }, [isValid]);

    return (
        <div className="border border-gray-300 rounded-md bg-white p-3">
            <div className="flex flex-wrap items-end gap-3">
                <TimeSelect label="Start" time={start} onChange={(t) => onChange(`${t}-${end}`)} />
                <span className="hidden sm:inline pb-2 text-gray-400" aria-hidden="true">&rarr;</span>
                <TimeSelect label="End" time={end} onChange={(t) => onChange(`${start}-${t}`)} hourRef={endHourRef} />
                <div className="pb-2 text-sm">
                    {isValid ? (
                        <span className="text-gray-600"><span className="font-semibold text-gray-800">{formatDuration(duration)}</span> operating window</span>
                    ) : (
                        <span className="text-red-600">End time must be after start time.</span>
                    )}
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="text-xs text-gray-500">Presets:</span>
                {PRESETS.map(preset => {
                    const active = preset.value === `${start}-${end}`;
                    return (
                        <button
                            key={preset.value}
                            type="button"
                            onClick={() => onChange(preset.value)}
                            aria-pressed={active}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${active ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:border-indigo-400 hover:text-indigo-700'}`}
                        >
                            {preset.label} <span className="font-mono opacity-80">{preset.value.replace('-', '–')}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
