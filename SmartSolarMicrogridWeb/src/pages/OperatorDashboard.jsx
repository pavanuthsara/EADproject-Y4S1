import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import NodeManagement from '../components/nodes/NodeManagement';
import ReservationManagement from '../components/reservations/ReservationManagement';
import { getNodes } from '../services/nodeService';
import { getReservations } from '../services/reservationService';

// Grid Operator dashboard: hubs and reservations.
function OperatorDashboard() {
    const { activeTab = 'overview', handleSelectTab } = useOutletContext() || {};

    const [nodes, setNodes] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [nodesData, resData] = await Promise.allSettled([
                getNodes(),
                getReservations(),
            ]);
            if (nodesData.status === 'fulfilled' && Array.isArray(nodesData.value)) {
                setNodes(nodesData.value);
            }
            if (resData.status === 'fulfilled' && Array.isArray(resData.value)) {
                setReservations(resData.value);
            }
        } catch {
            // Ignore
        } finally {
            setIsLoading(false);
        }
    };

    const TABS = [
        { id: 'overview', label: 'Operations Overview' },
        { id: 'nodes', label: 'Nodes & Battery Slots' },
        { id: 'reservations', label: 'Reservations & QR Assist' },
    ];

    const pendingCount = reservations.filter((r) => r.status === 'Pending').length;
    const approvedCount = reservations.filter((r) => r.status === 'Approved').length;
    const totalCapacity = nodes.reduce((acc, n) => acc + (n.capacityKwh || 0), 0);

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header & Subtitle */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                            Grid Operator Console
                        </h1>
                    </div>
                    <p className="text-sm text-[#64748B] mt-1">
                        Live monitoring of solar microgrid stations, battery slots, and energy transfers.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Operator Telemetry Active
                    </span>
                    <button
                        onClick={loadData}
                        className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition border border-slate-200 bg-white shadow-sm flex items-center gap-1.5 text-xs font-semibold"
                        title="Sync Telemetry"
                    >
                        <svg className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#10B981]' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Sync</span>
                    </button>
                </div>
            </div>

            {/* Tab Pill Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleSelectTab && handleSelectTab(tab.id)}
                            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-150 ${
                                isActive
                                    ? 'bg-[#10B981] text-white shadow-md shadow-emerald-500/25'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80 shadow-sm'
                            }`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
                <div className="space-y-8 animate-fadeIn">
                    {/* Operator KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {/* Microgrid Hubs Under Control */}
                        <div
                            onClick={() => handleSelectTab && handleSelectTab('nodes')}
                            className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-sm hover:shadow-md transition cursor-pointer relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition group-hover:scale-110"></div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Assigned Hubs</span>
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="text-3xl font-black text-[#0F172A]">{nodes.length}</div>
                                <p className="text-xs text-emerald-700 font-medium mt-1">Operational solar microgrid nodes</p>
                            </div>
                        </div>

                        {/* Total Managed Capacity */}
                        <div className="p-5 rounded-2xl bg-white border border-amber-200 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4"></div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Total Capacity</span>
                                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="text-3xl font-black text-[#0F172A]">{totalCapacity} <span className="text-sm font-semibold text-slate-500">kWh</span></div>
                                <p className="text-xs text-amber-700 font-medium mt-1">Cumulative battery storage</p>
                            </div>
                        </div>

                        {/* Pending Approvals */}
                        <div
                            onClick={() => handleSelectTab && handleSelectTab('reservations')}
                            className="p-5 rounded-2xl bg-white border border-amber-200 shadow-sm hover:shadow-md transition cursor-pointer relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 transition group-hover:scale-110"></div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Pending Review</span>
                                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="text-3xl font-black text-[#0F172A]">{pendingCount}</div>
                                <p className="text-xs text-amber-700 font-medium mt-1">Reservations requiring decision</p>
                            </div>
                        </div>

                        {/* Approved & Active Transfers */}
                        <div
                            onClick={() => handleSelectTab && handleSelectTab('reservations')}
                            className="p-5 rounded-2xl bg-white border border-blue-200 shadow-sm hover:shadow-md transition cursor-pointer relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition group-hover:scale-110"></div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Approved Jobs</span>
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="text-3xl font-black text-[#0F172A]">{approvedCount}</div>
                                <p className="text-xs text-blue-700 font-medium mt-1">Pending physical transfer completion</p>
                            </div>
                        </div>
                    </div>

                    {/* Operator Action Launchpad */}
                    <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-base font-bold text-[#0F172A]">Operator Actions &amp; Tools</h2>
                                <p className="text-xs text-[#64748B]">Operational tasks permitted for Grid Operators</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => handleSelectTab && handleSelectTab('nodes')}
                                className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-emerald-50/40 hover:border-emerald-300 text-left transition group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-[#10B981] text-white flex items-center justify-center font-bold mb-3 shadow-sm">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-sm text-[#0F172A] group-hover:text-emerald-700">Hub Battery Slots &amp; Schedules</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Update operating schedules, open/close charging slots, and configure bay availability for prosumers.
                                </p>
                            </button>

                            <button
                                onClick={() => handleSelectTab && handleSelectTab('reservations')}
                                className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-amber-50/40 hover:border-amber-300 text-left transition group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-[#F59E0B] text-white flex items-center justify-center font-bold mb-3 shadow-sm">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-sm text-[#0F172A] group-hover:text-amber-700">Monitor Bookings &amp; Assist Cancellations</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Review booked slots, verify 12-hour cancellation notice compliance, and assist prosumers with energy jobs.
                                </p>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: NODES */}
            {activeTab === 'nodes' && (
                <section className="animate-fadeIn">
                    <NodeManagement />
                </section>
            )}

            {/* TAB: RESERVATIONS */}
            {activeTab === 'reservations' && (
                <section className="animate-fadeIn">
                    <ReservationManagement />
                </section>
            )}
        </div>
    );
}

export default OperatorDashboard;
