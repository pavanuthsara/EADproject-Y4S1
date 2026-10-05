import React, { useState, useEffect, useCallback } from 'react';
import { getReservations } from '../../services/reservationService';
import ReservationDecisionActions from '../reservations/ReservationDecisionActions';
import { RESERVATION_STATUS_STYLES, DIRECTION_SHORT, formatKwh, formatTimeRange } from '../../utils/slotUtils';

export default function SlotBookingsDrawer({ slot, onClose, onChanged }) {
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    // Loads the reservations booked on this slot.
    const load = useCallback(async () => {
        setIsLoading(true);
        try {
            setBookings(await getReservations({ slotId: slot.id }));
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to load the bookings for this slot.');
        } finally {
            setIsLoading(false);
        }
    }, [slot.id]);

    useEffect(() => {
        load();
    }, [load]);

    // Shows the outcome of an approve/reject decision and reloads the bookings.
    const handleDecided = async (updated) => {
        setNotice(`${updated.reservationNo}: ${updated.message}`);
        await load();
        onChanged?.();
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs" role="dialog" aria-modal="true">
            <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200">
                <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                            <h3 className="text-base font-bold text-slate-900">Reservations In Slot</h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 font-mono">
                            {new Date(slot.startTime).toLocaleDateString()} · {formatTimeRange(slot)}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                            {slot.reservedPositions} of {slot.totalPositions} positions · {formatKwh(slot.reservedKwh)} of {formatKwh(slot.capacityKwh)} booked
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none" aria-label="Close">×</button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                    {error && <div className="bg-red-50 border-l-4 border-red-500 p-3 text-xs text-red-700 rounded-r-lg font-medium">{error}</div>}
                    {notice && <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 text-xs text-emerald-800 rounded-r-lg font-medium">{notice}</div>}

                    {isLoading && bookings.length === 0 && (
                        <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-6 w-6 border-2 border-[#F59E0B] border-t-transparent"></div></div>
                    )}

                    {!isLoading && bookings.length === 0 && !error && (
                        <p className="text-center text-xs text-slate-400 py-12">Nobody has reserved this slot yet.</p>
                    )}

                    {bookings.map((booking) => (
                        <div key={booking.reservationId} className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white shadow-xs">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-mono font-bold text-xs text-slate-900">{booking.reservationNo}</p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">NIC: <span className="font-mono">{booking.prosumerNic}</span></p>
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${RESERVATION_STATUS_STYLES[booking.status]}`}>
                                    {booking.status}
                                </span>
                            </div>
                            <p className="text-xs text-slate-700 font-semibold bg-slate-50 p-2 rounded-xl">
                                {DIRECTION_SHORT[booking.direction] ?? booking.direction} · {formatKwh(booking.requestedKwh)}
                            </p>
                            {booking.status === 'Rejected' && booking.rejectionReason && (
                                <p className="text-xs text-red-700 bg-red-50 p-2 rounded-xl border border-red-100">Reason: {booking.rejectionReason}</p>
                            )}
                            <ReservationDecisionActions reservation={booking} onDecided={handleDecided} onError={setError} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
