import React, { useState, useEffect } from 'react';
import { getStaff, createStaff, updateStaff, updateStaffStatus } from '../../services/staffService';

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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

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

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingId(null);
        setError('');
    };

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
        return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mt-6">
            <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:justify-between md:items-center bg-gray-50 gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">Staff Management</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage internal users: Backoffice and Grid Operators.</p>
                </div>
                <button 
                    onClick={() => openForm()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm whitespace-nowrap"
                >
                    + Add Staff
                </button>
            </div>

            {/* Filters */}
            <div className="border-b border-gray-200 bg-white px-6 py-3 flex gap-4">
                {['All', 'Backoffice', 'GridOperator'].map(role => (
                    <button
                        key={role}
                        onClick={() => setFilterRole(role)}
                        className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                            filterRole === role 
                                ? 'border-indigo-600 text-indigo-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        {role === 'GridOperator' ? 'Grid Operators' : role}
                        <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                            {role === 'All' 
                                ? staffList.length 
                                : staffList.filter(s => s.role === role).length}
                        </span>
                    </button>
                ))}
            </div>

            {error && !isFormOpen && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {isFormOpen && (
                <div className="p-6 border-b border-gray-200 bg-indigo-50/30">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-800">
                            {editingId ? `Edit Staff: ${editingId}` : 'Create New Staff Member'}
                        </h3>
                        <button onClick={closeForm} className="text-gray-500 hover:text-gray-700">✕ Close</button>
                    </div>
                    
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>
                    )}

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input 
                                required
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full border-gray-300 rounded-md shadow-sm border p-2 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input 
                                required
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full border-gray-300 rounded-md shadow-sm border p-2 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password {editingId && <span className="text-xs text-gray-400 font-normal">(Leave blank to keep current)</span>}
                            </label>
                            <input 
                                required={!editingId}
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className="w-full border-gray-300 rounded-md shadow-sm border p-2 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                                className="w-full border-gray-300 rounded-md shadow-sm border p-2 bg-white"
                            >
                                <option value="GridOperator">Grid Operator</option>
                                <option value="Backoffice">Backoffice</option>
                            </select>
                        </div>
                        
                        <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                            <button type="button" onClick={closeForm} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 font-medium">
                                Cancel
                            </button>
                            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium disabled:opacity-50">
                                {isSubmitting ? 'Saving...' : (editingId ? 'Update Staff' : 'Create Staff')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {filteredStaff.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-gray-500">
                                    No staff members found.
                                </td>
                            </tr>
                        ) : (
                            filteredStaff.map((staff) => (
                                <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 whitespace-nowrap text-sm font-medium text-gray-900">{staff.id}</td>
                                    <td className="p-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{staff.fullName || staff.name}</div>
                                        <div className="text-xs text-gray-500">{staff.email}</div>
                                    </td>
                                    <td className="p-4 whitespace-nowrap text-sm text-gray-600">
                                        {staff.role === 'GridOperator' ? 'Grid Operator' : 'Backoffice'}
                                    </td>
                                    <td className="p-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            staff.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {staff.status}
                                        </span>
                                    </td>
                                    <td className="p-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => openForm(staff)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                                        
                                        {staff.status === 'Active' ? (
                                            <button onClick={() => handleStatusChange(staff.id, 'Inactive')} className="text-red-600 hover:text-red-900">
                                                Deactivate
                                            </button>
                                        ) : (
                                            <button onClick={() => handleStatusChange(staff.id, 'Active')} className="text-green-600 hover:text-green-900">
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
