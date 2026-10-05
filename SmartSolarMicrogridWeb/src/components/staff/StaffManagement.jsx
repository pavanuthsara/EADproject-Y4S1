import React, { useState, useEffect } from 'react';
import { getStaff, createStaff, updateStaff, updateStaffStatus } from '../../services/staffService';

// Backoffice screen for listing, creating, editing and (de)activating staff accounts.
export default function StaffManagement() {
    const [staffList, setStaffList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Filter
    const [filterRole, setFilterRole] = useState('All'); // All, Backoffice, GridOperator
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'GridOperator'
    });

    useEffect(() => {
        loadStaff();
    }, []);

    // Loads all staff accounts from the API.
    const loadStaff = async () => {
        setIsLoading(true);
        try {
            const data = await getStaff();
            setStaffList(data);
            setError('');
        } catch (err) {
            setError('Failed to load staff list.');
        } finally {
            setIsLoading(false);
        }
    };

    // Updates a form field as the user types.
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Opens the form, pre-filled when editing an existing staff member.
    const openForm = (staff = null) => {
        if (staff) {
            setFormData({
                name: staff.fullName || staff.name || '',
                email: staff.email || '',
                password: '', // Don't populate password on edit
                role: staff.role || 'GridOperator'
            });
            setEditingId(staff.id);
        } else {
            setFormData({ name: '', email: '', password: '', role: 'GridOperator' });
            setEditingId(null);
        }
        setIsFormOpen(true);
        setError('');
    };

    // Closes the form and clears the editing state.
    const closeForm = () => {
        setIsFormOpen(false);
        setEditingId(null);
        setError('');
    };

    // Creates a new staff member or saves changes to the one being edited.
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            if (editingId) {
                await updateStaff(editingId, formData);
            } else {
                await createStaff(formData);
            }
            await loadStaff();
            closeForm();
        } catch (err) {
            setError(err.message || 'An error occurred while saving.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Changes a staff member's account status and reloads the list.
    const handleStatusChange = async (id, newStatus) => {
        try {
            await updateStaffStatus(id, newStatus);
            await loadStaff();
        } catch (err) {
            alert('Failed to update status.');
        }
    };

    const filteredStaff = staffList.filter(s => filterRole === 'All' || s.role === filterRole);

    if (isLoading && staffList.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
                <div className="w-10 h-10 border-4 border-[#F59E0B] border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm font-medium text-slate-500">Loading Staff Directory...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:justify-between md:items-center bg-slate-50/80 gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                        <h2 className="text-xl font-bold text-slate-900">Staff & Roles Directory</h2>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Manage internal operators, engineers, and administrative access rights.
                    </p>
                </div>
                <button 
                    onClick={() => openForm()}
                    className="inline-flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#d97706] text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all transform active:scale-95 whitespace-nowrap cursor-pointer"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Staff Member
                </button>
            </div>

            {/* Role Filter Tabs */}
            <div className="border-b border-slate-200 bg-white px-6 py-3 flex gap-2 overflow-x-auto">
                {['All', 'Backoffice', 'GridOperator'].map(role => {
                    const isSelected = filterRole === role;
                    const count = role === 'All' 
                        ? staffList.length 
                        : staffList.filter(s => s.role === role).length;
                    return (
                        <button
                            key={role}
                            onClick={() => setFilterRole(role)}
                            className={`text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                                isSelected 
                                    ? 'bg-[#0F172A] text-white shadow-sm' 
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                            {role === 'GridOperator' ? 'Grid Operators' : role}
                            <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                                isSelected 
                                    ? 'bg-white/20 text-white' 
                                    : 'bg-slate-100 text-slate-600'
                            }`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {error && !isFormOpen && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6 rounded-r-xl">
                    <p className="text-red-700 text-xs sm:text-sm font-medium">{error}</p>
                </div>
            )}

            {isFormOpen && (
                <div className="p-6 border-b border-slate-200 bg-amber-50/20">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900">
                                {editingId ? `Update Staff (${editingId})` : 'Create Staff Member'}
                            </h3>
                        </div>
                        <button 
                            onClick={closeForm} 
                            className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                            ✕ Cancel
                        </button>
                    </div>
                    
                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-xl mb-4 text-xs font-semibold border border-red-100">{error}</div>
                    )}

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Full Name</label>
                            <input 
                                required
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full border-slate-200 rounded-xl shadow-xs focus:ring-2 focus:ring-[#F59E0B] focus:outline-none border p-2.5 text-sm bg-white"
                                placeholder="e.g. Ruwan Silva"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Email Address</label>
                            <input 
                                required
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full border-slate-200 rounded-xl shadow-xs focus:ring-2 focus:ring-[#F59E0B] focus:outline-none border p-2.5 text-sm bg-white"
                                placeholder="ruwan@solarix.energy"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                Password {editingId && <span className="text-slate-400 font-normal lowercase">(leave blank to keep current)</span>}
                            </label>
                            <input 
                                required={!editingId}
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className="w-full border-slate-200 rounded-xl shadow-xs focus:ring-2 focus:ring-[#F59E0B] focus:outline-none border p-2.5 text-sm bg-white"
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Assigned Role</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                                className="w-full border-slate-200 rounded-xl shadow-xs focus:ring-2 focus:ring-[#F59E0B] focus:outline-none border p-2.5 text-sm bg-white font-medium"
                            >
                                <option value="GridOperator">Grid Operator (Hub monitoring & slots)</option>
                                <option value="Backoffice">Backoffice (Master Administration)</option>
                            </select>
                        </div>
                        
                        <div className="md:col-span-2 flex justify-end gap-2.5 mt-2">
                            <button 
                                type="button" 
                                onClick={closeForm} 
                                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 bg-white hover:bg-slate-50 text-sm font-semibold transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={isSubmitting} 
                                className="px-5 py-2 bg-[#F59E0B] text-slate-950 font-bold rounded-xl hover:bg-[#d97706] text-sm shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                            >
                                {isSubmitting ? 'Saving...' : (editingId ? 'Update Credentials' : 'Create Staff Member')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Staff ID</th>
                            <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Member Details</th>
                            <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Access Scope</th>
                            <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white text-sm">
                        {filteredStaff.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="p-10 text-center text-slate-500">
                                    No staff members registered under this filter.
                                </td>
                            </tr>
                        ) : (
                            filteredStaff.map((staff) => (
                                <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="p-4 whitespace-nowrap text-xs font-mono font-bold text-slate-800">
                                        {staff.id}
                                    </td>
                                    <td className="p-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-slate-900">{staff.fullName || staff.name}</div>
                                        <div className="text-xs text-slate-500 font-medium">{staff.email}</div>
                                    </td>
                                    <td className="p-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                                            staff.role === 'Backoffice' 
                                                ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${staff.role === 'Backoffice' ? 'bg-purple-500' : 'bg-[#10B981]'}`}></span>
                                            {staff.role === 'GridOperator' ? 'Grid Operator' : 'Backoffice'}
                                        </span>
                                    </td>
                                    <td className="p-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                            staff.status === 'Active' 
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${staff.status === 'Active' ? 'bg-[#10B981]' : 'bg-rose-500'}`}></span>
                                            {staff.status}
                                        </span>
                                    </td>
                                    <td className="p-4 whitespace-nowrap text-right text-xs font-semibold">
                                        <button 
                                            onClick={() => openForm(staff)} 
                                            className="text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg mr-2 transition-all cursor-pointer"
                                        >
                                            Edit
                                        </button>
                                        
                                        {staff.status === 'Active' ? (
                                            <button 
                                                onClick={() => handleStatusChange(staff.id, 'Inactive')} 
                                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                                            >
                                                Deactivate
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => handleStatusChange(staff.id, 'Active')} 
                                                className="bg-[#10B981] hover:bg-[#059669] text-white px-3 py-1.5 rounded-lg font-bold shadow-xs transition-all cursor-pointer"
                                            >
                                                Activate
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
