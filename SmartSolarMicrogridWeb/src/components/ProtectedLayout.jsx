import React, { useState } from 'react';
import { Navigate, Outlet, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { getRole, logout } from '../services/authService';

const DASHBOARD_BY_ROLE = {
  Backoffice: '/backoffice',
  GridOperator: '/operator',
};

// Layout for signed-in pages; redirects users who are signed out or lack an allowed role.
const BACKOFFICE_NAV_ITEMS = [
  {
    id: 'overview',
    label: 'Overview & KPIs',
    description: 'System metrics & activity',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'prosumers',
    label: 'Prosumer Accounts',
    description: 'Approvals & activation',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    id: 'nodes',
    label: 'Microgrid Nodes',
    description: 'Hubs, schedules & battery',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'reservations',
    label: 'Energy Trading',
    description: 'Reservations & bookings',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: 'staff',
    label: 'Staff Management',
    description: 'Backoffice & Operators',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

const OPERATOR_NAV_ITEMS = [
  {
    id: 'overview',
    label: 'Operations Overview',
    description: 'Live hub & transfer monitor',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: 'nodes',
    label: 'Nodes & Battery Slots',
    description: 'Bays, slots & availability',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    id: 'reservations',
    label: 'Reservations & QR Assist',
    description: 'Monitor bookings & cancel assist',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
    ),
  },
];

const ProtectedLayout = ({ allowedRoles }) => {
  const role = getRole();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If not logged in, redirect to login
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  // If user role is not allowed for this route, redirect to their own dashboard
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={DASHBOARD_BY_ROLE[role] ?? '/login'} replace />;
  }

  // Signs out and returns to the login page.
  const navItems = role === 'Backoffice' ? BACKOFFICE_NAV_ITEMS : OPERATOR_NAV_ITEMS;
  const activeTab = searchParams.get('tab') || 'overview';

  const handleSelectTab = (tabId) => {
    setSearchParams({ tab: tabId });
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = role === 'Backoffice' ? 'BO' : 'GO';

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden text-[#0F172A] font-sans">
      {/* Sidebar for Desktop */}
      <aside className="w-72 bg-white border-r border-[#E2E8F0] hidden lg:flex flex-col flex-shrink-0 z-20">
        {/* Brand Header */}
        <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#F59E0B] to-[#10B981] flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-[#0F172A]">SOLARIX</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">GRID</span>
              </div>
              <p className="text-xs text-[#64748B] font-medium">Smart Energy Trading</p>
            </div>
          </div>
        </div>

        {/* Role & System Health Card */}
        <div className="px-5 py-4 border-b border-[#E2E8F0] bg-slate-50/70">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Console Mode</span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Grid Online
            </span>
          </div>
          <div className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${
            role === 'Backoffice'
              ? 'bg-amber-500/10 border-amber-200 text-amber-900'
              : 'bg-emerald-500/10 border-emerald-200 text-emerald-900'
          }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
              role === 'Backoffice' ? 'bg-[#F59E0B] text-white' : 'bg-[#10B981] text-white'
            }`}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-xs truncate">
                {role === 'Backoffice' ? 'Backoffice Administrator' : 'Grid Operations Officer'}
              </p>
              <p className="text-[11px] text-[#64748B] truncate">Authorized Web Session</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="p-4 flex-grow overflow-y-auto space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-2">
            Navigation Menu
          </p>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/15 to-emerald-500/10 text-[#0F172A] font-semibold shadow-sm border border-amber-500/30'
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 font-medium'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${
                  isActive ? 'bg-[#F59E0B] text-white' : 'text-[#64748B]'
                }`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{item.label}</div>
                  <div className="text-[11px] text-[#94A3B8] truncate">{item.description}</div>
                </div>
                {isActive && (
                  <div className="w-1.5 h-6 rounded-full bg-[#F59E0B]"></div>
                )}
              </button>
            );
          })}

          {/* Quick Rules & Guidelines widget */}
          <div className="mt-6 p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-[#0F172A] font-bold text-xs">
              <svg className="w-4 h-4 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Microgrid Trading Rules
            </div>
            <ul className="text-[11px] text-[#64748B] space-y-1.5">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Booking Window: Next 7 Days</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>Change Notice: 12h Required</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>Secure QR verification active</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Sidebar Footer with Logout */}
        <div className="p-4 border-t border-[#E2E8F0] bg-slate-50/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 py-2.5 px-4 rounded-xl border border-red-200 transition-all duration-150 font-semibold text-sm shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header / Bar */}
        <header className="bg-white border-b border-[#E2E8F0] px-6 py-3.5 flex items-center justify-between z-10 flex-shrink-0">
          {/* Mobile hamburger + Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {role === 'Backoffice' ? 'Backoffice' : 'Grid Operator'}
              </span>
              <span className="text-slate-400">/</span>
              <h1 className="text-sm md:text-base font-bold text-[#0F172A] capitalize">
                {navItems.find((i) => i.id === activeTab)?.label || 'Overview'}
              </h1>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#64748B] bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>API Gateway: Online</span>
            </div>
            <button
              onClick={handleLogout}
              className="lg:hidden text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Mobile Sidebar Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-[85%] bg-white h-full flex flex-col p-4 shadow-2xl z-10">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="font-extrabold text-base text-[#0F172A]">SOLARIX PORTAL</div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="py-4 space-y-1 flex-1 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                        isActive
                          ? 'bg-amber-500/15 text-[#0F172A] font-bold border border-amber-500/30'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {item.icon}
                      <span className="text-sm">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-red-50 text-red-600 font-semibold text-sm border border-red-200"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F8FAFC] p-4 md:p-8">
          <Outlet context={{ activeTab, handleSelectTab }} />
        </main>
      </div>
    </div>
  );
};

export default ProtectedLayout;
