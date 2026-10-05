import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import ProsumerManagement from '../components/prosumer/ProsumerManagement';
import NodeManagement from '../components/nodes/NodeManagement';
import ReservationManagement from '../components/reservations/ReservationManagement';
import StaffManagement from '../components/staff/StaffManagement';
import { getDashboardAnalytics, getProsumers } from '../services/prosumerService';
import { getNodes } from '../services/nodeService';

// Backoffice dashboard: prosumers, staff, hubs and reservations.
function BackofficeDashboard() {
    const { activeTab = 'overview', handleSelectTab } = useOutletContext() || {};

    const [analytics, setAnalytics] = useState(null);
    const [prosumerCount, setProsumerCount] = useState(0);
    const [pendingProsumerCount, setPendingProsumerCount] = useState(0);
    const [nodeCount, setNodeCount] = useState(0);
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    useEffect(() => {
        loadOverviewStats();
    }, []);

    const loadOverviewStats = async () => {
        setIsLoadingStats(true);
        try {
            const [analyticsData, prosumersData, nodesData] = await Promise.allSettled([
                getDashboardAnalytics(),
                getProsumers(),
                getNodes(),
            ]);

            if (analyticsData.status === 'fulfilled' && analyticsData.value) {
                setAnalytics(analyticsData.value);
            }
            if (prosumersData.status === 'fulfilled' && Array.isArray(prosumersData.value)) {
                setProsumerCount(prosumersData.value.length);
                const pending = prosumersData.value.filter((p) => p.accountStatus === 'Pending' || p.status === 'Pending').length;
                setPendingProsumerCount(pending);
            }
            if (nodesData.status === 'fulfilled' && Array.isArray(nodesData.value)) {
                setNodeCount(nodesData.value.length);
            }
        } catch {
            // Stats fallback to 0
        } finally {
            setIsLoadingStats(false);
        }
    };

    const TABS = [
        { id: 'overview', label: 'Overview & KPIs' },
        { id: 'prosumers', label: 'Prosumer Accounts' },
        { id: 'nodes', label: 'Microgrid Nodes' },
        { id: 'reservations', label: 'Energy Trading' },
        { id: 'staff', label: 'Staff Management' },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Top Header & Navigation Pills */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                            Backoffice Administration
                        </h1>
                    </div>
                    <p className="text-sm text-[#64748B] mt-1">
                        Central operational management for solar microgrids, prosumers, and trading bookings.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={loadOverviewStats}
                        className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition border border-slate-200 bg-white shadow-sm flex items-center gap-1.5 text-xs font-semibold"
                        title="Refresh Analytics"
                    >
                        <svg className={`w-4 h-4 ${isLoadingStats ? 'animate-spin text-[#F59E0B]' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                                    ? 'bg-[#F59E0B] text-white shadow-md shadow-amber-500/25'
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
                    {/* KPI Metric Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {/* Pending Approvals Card */}
                        <div
                            onClick={() => handleSelectTab && handleSelectTab('reservations')}
                            className="p-5 rounded-2xl bg-white border border-amber-200 shadow-sm hover:shadow-md transition cursor-pointer relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 transition group-hover:scale-110"></div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Pending Bookings</span>
                                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="text-3xl font-black text-[#0F172A]">
                                    {analytics?.pendingReservations ?? 0}
                                </div>
                                <p className="text-xs text-amber-700 font-medium mt-1">
                                    Awaiting operator approval
                                </p>
                            </div>
                        </div>

                        {/* Active Microgrid Nodes */}
                        <div
                            onClick={() => handleSelectTab && handleSelectTab('nodes')}
                            className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-sm hover:shadow-md transition cursor-pointer relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition group-hover:scale-110"></div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Microgrid Nodes</span>
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="text-3xl font-black text-[#0F172A]">
                                    {nodeCount}
                                </div>
                                <p className="text-xs text-emerald-700 font-medium mt-1">
                                    Active distribution hubs
                                </p>
                            </div>
                        </div>

                        {/* Approved Future Reservations */}
                        <div
                            onClick={() => handleSelectTab && handleSelectTab('reservations')}
                            className="p-5 rounded-2xl bg-white border border-blue-200 shadow-sm hover:shadow-md transition cursor-pointer relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition group-hover:scale-110"></div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Approved Bookings</span>
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="text-3xl font-black text-[#0F172A]">
                                    {analytics?.approvedFutureReservations ?? 0}
                                </div>
                                <p className="text-xs text-blue-700 font-medium mt-1">
                                    Ready for QR energy transfer
                                </p>
                            </div>
                        </div>

                        {/* Total Prosumers */}
                        <div
                            onClick={() => handleSelectTab && handleSelectTab('prosumers')}
                            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full -mr-4 -mt-4 transition group-hover:scale-110"></div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Prosumers</span>
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="text-3xl font-black text-[#0F172A]">
                                    {prosumerCount}
                                </div>
                                <p className="text-xs text-slate-500 font-medium mt-1">
                                    {pendingProsumerCount > 0 ? (
                                        <span className="text-amber-600 font-bold">{pendingProsumerCount} pending approvals</span>
                                    ) : (
                                        'All prosumers active'
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Operations Launchpad */}
                    <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-base font-bold text-[#0F172A]">Operational Modules</h2>
                                <p className="text-xs text-[#64748B]">Direct access to primary administrative workspaces</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <button
                                onClick={() => handleSelectTab && handleSelectTab('prosumers')}
                                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-amber-50/40 hover:border-amber-300 text-left transition group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-[#F59E0B] text-white flex items-center justify-center font-bold mb-3 shadow-sm">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-sm text-[#0F172A] group-hover:text-amber-700">Prosumer Management</h3>
                                <p className="text-xs text-slate-500 mt-1">Register new solar prosumers, activate pending accounts, and manage deactivation approvals.</p>
                            </button>

                            <button
                                onClick={() => handleSelectTab && handleSelectTab('nodes')}
                                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-emerald-50/40 hover:border-emerald-300 text-left transition group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-[#10B981] text-white flex items-center justify-center font-bold mb-3 shadow-sm">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-sm text-[#0F172A] group-hover:text-emerald-700">Solar Hubs &amp; Nodes</h3>
                                <p className="text-xs text-slate-500 mt-1">Create solar microgrid stations, configure battery storage bays, and manage operational hours.</p>
                            </button>

                            <button
                                onClick={() => handleSelectTab && handleSelectTab('reservations')}
                                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/40 hover:border-blue-300 text-left transition group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold mb-3 shadow-sm">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-sm text-[#0F172A] group-hover:text-blue-700">Reservations &amp; Bookings</h3>
                                <p className="text-xs text-slate-500 mt-1">Review power-trading booking requests, process approvals/rejections, and monitor transfer status.</p>
                            </button>

                            <button
                                onClick={() => handleSelectTab && handleSelectTab('staff')}
                                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-purple-50/40 hover:border-purple-300 text-left transition group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold mb-3 shadow-sm">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-sm text-[#0F172A] group-hover:text-purple-700">Staff Administration</h3>
                                <p className="text-xs text-slate-500 mt-1">Provision Backoffice and Grid Operator credentials, assign hub zones, and manage system roles.</p>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: PROSUMERS */}
            {activeTab === 'prosumers' && (
                <section className="animate-fadeIn">
                    <ProsumerManagement />
                </section>
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

            {/* TAB: STAFF */}
            {activeTab === 'staff' && (
                <section className="animate-fadeIn">
                    <StaffManagement />
                </section>
            )}
        </div>
    );
}

export default BackofficeDashboard;
