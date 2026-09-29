import React from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { getRole, logout } from '../services/authService';

const ProtectedLayout = ({ allowedRoles }) => {
  const role = getRole();
  const navigate = useNavigate();

  // If not logged in, redirect to login
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  // If user role is not allowed for this route, redirect to their own dashboard
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={role === 'GridOperator' ? '/operator' : '/backoffice'} replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for Desktop */}
      <aside className="w-64 bg-white shadow-md hidden md:flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        </div>
        <div className="p-6 flex-grow">
          <p className="text-sm text-gray-500 mb-1 uppercase tracking-wider">Logged in as:</p>
          <p className="font-semibold text-lg text-indigo-600">{role}</p>
        </div>
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors duration-200 font-medium shadow-sm"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Navbar */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden bg-white shadow-sm p-4 flex justify-between items-center z-10">
          <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-indigo-600">{role}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white py-1.5 px-3 rounded-md hover:bg-red-600 transition-colors duration-200 text-sm font-medium shadow-sm"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ProtectedLayout;
