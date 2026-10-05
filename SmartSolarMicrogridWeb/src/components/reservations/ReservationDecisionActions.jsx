import React, { useState } from 'react';
import { approveReservation, rejectReservation } from '../../services/reservationService';

const MIN_REASON_LENGTH = 3;
const MAX_REASON_LENGTH = 300;

// Approve / Reject buttons for staff. The API owns every rule: it only approves a Pending
// reservation whose slot has not started, and rejecting gives the slot its capacity back.
//
// Props:
//   reservation - ReservationSummaryResponse
//   onDecided(updated) - called with the API's updated reservation after a successful decision
//   onError(message)   - called with the API's message when a decision fails
export default function ReservationDecisionActions({ reservation, onDecided, onError }) {
    const [isRejecting, setIsRejecting] = useState(false);
    const [reason, setReason] = useState('');
    const [isBusy, setIsBusy] = useState(false);

    const canApprove = reservation.status === 'Pending';
    const canReject = reservation.status === 'Pending' || reservation.status === 'Approved';

    if (!canApprove && !canReject) return null;

    const slotStarted = new Date(reservation.slotStartUtc).getTime() <= Date.now();

    // Runs an approve or reject call and reports the result to the parent.
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

    // Approves the reservation.
    const handleApprove = () => run(() => approveReservation(reservation.reservationId));

    // Rejects the reservation with the entered reason.
    const handleReject = () => run(() => rejectReservation(reservation.reservationId, reason.trim()));

    const reasonTooShort = reason.trim().length < MIN_REASON_LENGTH;

    if (isRejecting) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 space-y-2">
                <label className="block text-sm text-red-800" htmlFor={`reject-${reservation.reservationId}`}>
                    Why is {reservation.reservationNo} being rejected? The prosumer will see this.
                </label>
                <textarea
                    id={`reject-${reservation.reservationId}`}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={MAX_REASON_LENGTH}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white"
                    placeholder="e.g. Battery maintenance on that day"
                />
                <p className="text-xs text-red-700">
                    Its reserved position and kWh go back to the slot straight away.
                </p>
                <div className="flex gap-2 justify-end">
                    <button
                        type="button"
                        onClick={() => { setIsRejecting(false); setReason(''); }}
                        disabled={isBusy}
                        className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
                    >
                        Back
                    </button>
                    <button
                        type="button"
                        onClick={handleReject}
                        disabled={isBusy || reasonTooShort}
                        className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                    >
                        {isBusy ? 'Rejecting…' : 'Confirm rejection'}
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
                    title={slotStarted ? 'This slot has already started, so it can only be rejected.' : 'Approve this reservation'}
                    className="px-3 py-1.5 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isBusy ? 'Approving…' : 'Approve'}
                </button>
            )}
            {canReject && (
                <button
                    type="button"
                    onClick={() => setIsRejecting(true)}
                    disabled={isBusy}
                    className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded text-sm font-medium"
                >
                    Reject
                </button>
            )}
        </div>
    );
}
