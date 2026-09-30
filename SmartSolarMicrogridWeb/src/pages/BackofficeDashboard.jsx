import React from 'react';
import ProsumerManagement from '../components/prosumer/ProsumerManagement';
import ReservationManagement from '../components/reservations/ReservationManagement';

function BackofficeDashboard() {
    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Backoffice Dashboard</h1>
                <p className="text-gray-500 mt-2">Manage the smart solar microgrid system.</p>
            </header>

            <section>
                <ProsumerManagement />
            </section>

            <section>
                <ReservationManagement />
            </section>
        </div>
    );
}

export default BackofficeDashboard;
