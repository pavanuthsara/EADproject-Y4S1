import React from 'react';
import NodeManagement from '../components/nodes/NodeManagement';
import ReservationManagement from '../components/reservations/ReservationManagement';

function OperatorDashboard() {
    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Grid Operator Dashboard</h1>
                <p className="text-gray-500 mt-2">Manage smart solar microgrid hubs and operations.</p>
            </header>

            <section>
                <NodeManagement />
            </section>

            <section>
                <ReservationManagement />
            </section>
        </div>
    );
}

export default OperatorDashboard;
