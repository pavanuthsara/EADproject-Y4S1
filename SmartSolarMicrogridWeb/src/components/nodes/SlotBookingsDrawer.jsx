import React, { useState, useEffect, useCallback } from 'react';
import { getReservations } from '../../services/reservationService';
import ReservationDecisionActions from '../reservations/ReservationDecisionActions';
import { RESERVATION_STATUS_STYLES, DIRECTION_SHORT, formatKwh, formatTimeRange } from '../../utils/slotUtils';

// Side drawer listing every booking made on one slot, with approve / reject for staff.
//
// Props:
//   slot - the slot whose bookings are shown
//   onClose()   - close the drawer
//   onChanged() - called after a decision so the slot's battery bar can be refreshed
export default function SlotBookingsDrawer({ slot, onClose, onChanged }) {
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

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

    const handleDecided = async (updated) => {
        setNotice(`${updated.reservationNo}: ${updated.message}`);
        await load();
        onChanged?.();
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" role="dialog" aria-modal="true">
            <div className="bg-white w-full max-w-md h-full shadow-xl flex flex-col">
                <div className="p-5 border-b border-gray-200 flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Bookings in this slot</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {new Date(slot.startTime).toLocaleDateString()} · {formatTimeRange(slot)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {slot.reservedPositions} of {slot.totalPositions} positions · {formatKwh(slot.reservedKwh)} of {formatKwh(slot.capacityKwh)}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl leading-none" aria-label="Close">×</button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {error && <div className="bg-red-50 border-l-4 border-red-500 p-3 text-sm text-red-700">{error}</div>}
                    {notice && <div className="bg-green-50 border-l-4 border-green-500 p-3 text-sm text-green-800">{notice}</div>}

                    {isLoading && bookings.length === 0 && (
                        <div className="flex justify-center p-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div></div>
                    )}

                    {!isLoading && bookings.length === 0 && !error && (
                        <p className="text-center text-gray-500 py-8">Nobody has booked this slot yet.</p>
                    )}

                    {bookings.map((booking) => (
                        <div key={booking.reservationId} className="border border-gray-200 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-mono font-bold text-sm text-gray-900">{booking.reservationNo}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">NIC {booking.prosumerNic}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${RESERVATION_STATUS_STYLES[booking.status]}`}>
                                    {booking.status}
                                </span>
                            </div>
                            <p className="text-sm text-gray-800">
                                {DIRECTION_SHORT[booking.direction] ?? booking.direction} · {formatKwh(booking.requestedKwh)}
                            </p>
                            {booking.status === 'Rejected' && booking.rejectionReason && (
                                <p className="text-xs text-red-700">Reason: {booking.rejectionReason}</p>
                            )}
                            <ReservationDecisionActions reservation={booking} onDecided={handleDecided} onError={setError} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
