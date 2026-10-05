import React, { useState } from 'react';
import { approveReservation, rejectReservation } from '../../services/reservationService';

const MIN_REASON_LENGTH = 3;
const MAX_REASON_LENGTH = 300;

export default function ReservationDecisionActions({ reservation, onDecided, onError }) {
    const [isRejecting, setIsRejecting] = useState(false);
    const [reason, setReason] = useState('');
    const [isBusy, setIsBusy] = useState(false);

    const canApprove = reservation.status === 'Pending';
    const canReject = reservation.status === 'Pending' || reservation.status === 'Approved';

    if (!canApprove && !canReject) return null;

    const slotStarted = new Date(reservation.slotStartUtc).getTime() <= Date.now();

    const run = async (action) => {
        setIsBusy(true);
        onError?.('');
        try {
            const updated = await action();
            setIsRejecting(false);
            setReason('');
            onDecided?.(updated);
        } catch (err) {
            onError?.(err.message || 'The decision could not be saved.');
        } finally {
            setIsBusy(false);
        }
    };

    const handleApprove = () => run(() => approveReservation(reservation.reservationId));
    const handleReject = () => run(() => rejectReservation(reservation.reservationId, reason.trim()));

    const reasonTooShort = reason.trim().length < MIN_REASON_LENGTH;

    if (isRejecting) {
        return (
            <div className="bg-red-50/80 border border-red-200 rounded-2xl p-3.5 space-y-2">
                <label className="block text-xs font-semibold text-red-900" htmlFor={`reject-${reservation.reservationId}`}>
                    State the justification for rejecting {reservation.reservationNo}:
                </label>
                <textarea
                    id={`reject-${reservation.reservationId}`}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={MAX_REASON_LENGTH}
                    rows={2}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
                    placeholder="e.g. Inverter maintenance or grid load threshold exceeded"
                />
                <p className="text-[11px] text-red-700 font-medium">
                    Reserved position and kWh capacity will immediately return to the hub's pool.
                </p>
                <div className="flex gap-2 justify-end">
                    <button
                        type="button"
                        onClick={() => { setIsRejecting(false); setReason(''); }}
                        disabled={isBusy}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50 transition-colors"
                    >
                        Back
                    </button>
                    <button
                        type="button"
                        onClick={handleReject}
                        disabled={isBusy || reasonTooShort}
                        className="px-3.5 py-1.5 bg-red-600 text-white font-bold rounded-xl text-xs hover:bg-red-700 disabled:opacity-50 transition-colors shadow-xs"
                    >
                        {isBusy ? 'Rejecting…' : 'Confirm Rejection'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-end gap-2">
            {canApprove && (
                <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isBusy || slotStarted}
                    title={slotStarted ? 'This slot has already started, so it cannot be approved.' : 'Approve this reservation'}
                    className="px-3.5 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-all cursor-pointer"
                >
                    {isBusy ? 'Approving…' : '✓ Approve'}
                </button>
            )}
            {canReject && (
                <button
                    type="button"
                    onClick={() => setIsRejecting(true)}
                    disabled={isBusy}
                    className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                    Reject
                </button>
            )}
        </div>
    );
}
