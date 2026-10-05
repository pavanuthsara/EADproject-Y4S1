import React, { useEffect, useRef } from 'react';

// Operating schedule picker. Emits the "HH:mm-HH:mm" (24h) string the hub
// registration payload expects, so no manual formatting is left to the user.

// Left-pads a number to two digits ("6" -> "06").
const pad = (n) => String(n).padStart(2, '0');
const HOURS = Array.from({ length: 24 }, (_, i) => pad(i));
const MINUTES = ['00', '15', '30', '45'];
const DEFAULT_RANGE = { start: '06:00', end: '18:00' };

const PRESETS = [
    { label: 'Daylight', value: '06:00-18:00' },
    { label: 'Peak Sun', value: '09:00-15:00' },
    { label: 'Extended', value: '05:00-20:00' },
];

// Splits "HH:mm-HH:mm" into { start, end }; returns null if the format is invalid.
function parseTimeRange(value) {
    const match = /^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/.exec(value ?? '');
    return match ? { start: `${match[1]}:${match[2]}`, end: `${match[3]}:${match[4]}` } : null;
}

// Converts "HH:mm" to minutes since midnight.
const toMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

// Formats a minute count as "12h" or "7h 30m".
function formatDuration(totalMinutes) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// Hour and minute dropdowns for one end of the time range.
function TimeSelect({ label, time, onChange, hourRef }) {
    const [hour, minute] = time.split(':');
    const minuteOptions = MINUTES.includes(minute) ? MINUTES : [...MINUTES, minute].sort();
    const selectClass = 'border border-slate-200 rounded-xl bg-white p-2 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]';

    return (
        <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{label}</span>
            <div className="flex items-center gap-1">
                <select ref={hourRef} aria-label={`${label} hour`} value={hour} onChange={(e) => onChange(`${e.target.value}:${minute}`)} className={selectClass}>
                    {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <span className="font-bold text-slate-400">:</span>
                <select aria-label={`${label} minute`} value={minute} onChange={(e) => onChange(`${hour}:${e.target.value}`)} className={selectClass}>
                    {minuteOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>
        </div>
    );
}

// Start/end time picker with presets; reports the range as "HH:mm-HH:mm" via onChange.
export default function TimeRangePicker({ value, onChange }) {
    const { start, end } = parseTimeRange(value) ?? DEFAULT_RANGE;
    const duration = toMinutes(end) - toMinutes(start);
    const isValid = duration > 0;
    const endHourRef = useRef(null);

    useEffect(() => {
        endHourRef.current?.setCustomValidity(isValid ? '' : 'End time must be after start time.');
    }, [isValid]);

    return (
        <div className="border border-slate-200 rounded-2xl bg-slate-50/50 p-3.5">
            <div className="flex flex-wrap items-end gap-3">
                <TimeSelect label="Start Time" time={start} onChange={(t) => onChange(`${t}-${end}`)} />
                <span className="hidden sm:inline pb-2 text-slate-400" aria-hidden="true">&rarr;</span>
                <TimeSelect label="End Time" time={end} onChange={(t) => onChange(`${start}-${t}`)} hourRef={endHourRef} />
                <div className="pb-2 text-xs">
                    {isValid ? (
                        <span className="text-slate-600">
                            Window length: <span className="font-bold text-slate-900 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">{formatDuration(duration)}</span>
                        </span>
                    ) : (
                        <span className="text-red-600 font-semibold">End time must be after start time.</span>
                    )}
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Presets:</span>
                {PRESETS.map(preset => {
                    const active = preset.value === `${start}-${end}`;
                    return (
                        <button
                            key={preset.value}
                            type="button"
                            onClick={() => onChange(preset.value)}
                            aria-pressed={active}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                active 
                                    ? 'bg-[#F59E0B] border-[#F59E0B] text-slate-950 shadow-xs' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                        >
                            {preset.label} <span className="font-mono text-[10px] opacity-75">{preset.value.replace('-', '–')}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
