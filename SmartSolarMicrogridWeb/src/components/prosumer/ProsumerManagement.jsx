import React, { useState, useEffect } from 'react';
import { getProsumers, createProsumer, updateProsumer, toggleProsumerStatus } from '../../services/prosumerService';

export default function ProsumerManagement() {
    const [prosumers, setProsumers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingNic, setEditingNic] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Filters
    const [filterStatus, setFilterStatus] = useState('All'); // All, Pending, Active, Inactive
    
    const [formData, setFormData] = useState({
        nic: '',
        name: '',
        email: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        loadProsumers();
    }, []);

    const loadProsumers = async () => {
        setIsLoading(true);
        try {
            const data = await getProsumers();
            setProsumers(data);
            setError('');
        } catch (err) {
            setError('Failed to load prosumers.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openForm = (prosumer = null) => {
        if (prosumer) {
            setFormData({
                nic: prosumer.nic,
                name: prosumer.name,
                email: prosumer.email,
                phone: prosumer.phone,
                address: prosumer.address
            });
            setEditingNic(prosumer.nic);
        } else {
            setFormData({ nic: '', name: '', email: '', phone: '', address: '' });
            setEditingNic(null);
        }
        setIsFormOpen(true);
        setError('');
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingNic(null);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            if (editingNic) {
                await updateProsumer(editingNic, formData);
            } else {
                await createProsumer(formData);
            }
            await loadProsumers();
            closeForm();
        } catch (err) {
            setError(err.message || 'An error occurred while saving.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusChange = async (nic, newStatus) => {
        try {
            await toggleProsumerStatus(nic, newStatus);
            await loadProsumers();
        } catch (err) {
            alert('Failed to update status.');
        }
    };

    const filteredProsumers = prosumers.filter(p => {
        const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery = !q || 
            (p.nic && p.nic.toLowerCase().includes(q)) || 
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.email && p.email.toLowerCase().includes(q));
        return matchesStatus && matchesQuery;
    });

    if (isLoading && prosumers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
                <div className="w-10 h-10 border-4 border-[#F59E0B] border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm font-medium text-slate-500">Loading Prosumer Registry...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all">
            {/* Header Section */}
            <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:justify-between md:items-center bg-slate-50/80 gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                        <h2 className="text-xl font-bold text-slate-900">Prosumer Management</h2>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Review, activate, and manage solar producer accounts and profiles.
                    </p>
                </div>
                <button 
                    onClick={() => openForm()}
                    className="inline-flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#d97706] text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all transform active:scale-95 whitespace-nowrap cursor-pointer"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Prosumer
                </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="border-b border-slate-200 bg-white px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    {['All', 'Pending', 'Active', 'Inactive'].map(status => {
                        const count = status === 'All' 
                            ? prosumers.length 
                            : prosumers.filter(p => p.status === status).length;
                        const isSelected = filterStatus === status;
                        return (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                                    isSelected 
                                        ? 'bg-[#0F172A] text-white shadow-sm' 
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                {status}
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

                <div className="relative min-w-[240px]">
                    <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by NIC, name or email..."
                        className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:border-transparent transition-all"
                    />
                </div>
            </div>

            {/* Error Message Display */}
            {error && !isFormOpen && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6 rounded-r-xl">
                    <p className="text-red-700 text-xs sm:text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Form Section (Conditional Drawer/Panel) */}
            {isFormOpen && (
                <div className="p-6 border-b border-slate-200 bg-amber-50/20">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900">
                                {editingNic ? `Update Prosumer (${editingNic})` : 'Register New Prosumer'}
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
                        <div className="bg-red-50 text-red-700 p-3 rounded-xl mb-4 text-xs font-semibold border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                National Identity Card (NIC)
                            </label>
                            <input 
                                required
                                type="text"
                                name="nic"
                                value={formData.nic}
                                onChange={handleInputChange}
                                disabled={!!editingNic}
                                className="w-full border-slate-200 rounded-xl shadow-xs focus:ring-2 focus:ring-[#F59E0B] focus:outline-none border p-2.5 text-sm bg-white disabled:bg-slate-100 disabled:text-slate-400"
                                placeholder="e.g. 199512345678"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                Full Name
                            </label>
                            <input 
                                required
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full border-slate-200 rounded-xl shadow-xs focus:ring-2 focus:ring-[#F59E0B] focus:outline-none border p-2.5 text-sm bg-white"
                                placeholder="e.g. Kasun Perera"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                Email Address
                            </label>
                            <input 
                                required
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full border-slate-200 rounded-xl shadow-xs focus:ring-2 focus:ring-[#F59E0B] focus:outline-none border p-2.5 text-sm bg-white"
                                placeholder="kasun@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                Phone Number
                            </label>
                            <input 
                                required
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full border-slate-200 rounded-xl shadow-xs focus:ring-2 focus:ring-[#F59E0B] focus:outline-none border p-2.5 text-sm bg-white"
                                placeholder="0771234567"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                Address & Solar Site Details
                            </label>
                            <textarea 
                                required
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                rows="2"
                                className="w-full border-slate-200 rounded-xl shadow-xs focus:ring-2 focus:ring-[#F59E0B] focus:outline-none border p-2.5 text-sm bg-white"
                                placeholder="No. 45, Temple Road, Colombo 03"
                            ></textarea>
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
                                {isSubmitting ? 'Saving...' : (editingNic ? 'Update Profile' : 'Save Prosumer')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Data Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">NIC</th>
                            <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Prosumer</th>
                            <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contact Info</th>
                            <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Account Status</th>
                            <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white text-sm">
                        {filteredProsumers.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="p-10 text-center text-slate-500">
                                    <div className="max-w-xs mx-auto text-center space-y-1">
                                        <p className="font-semibold text-slate-800">No prosumers found</p>
                                        <p className="text-xs text-slate-400">
                                            {searchQuery ? `No matches for "${searchQuery}"` : `No records under status "${filterStatus}".`}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredProsumers.map((prosumer) => (
                                <tr key={prosumer.nic} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="p-4 whitespace-nowrap text-xs font-mono font-bold text-slate-800">
                                        {prosumer.nic}
                                    </td>
                                    <td className="p-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-slate-900">{prosumer.name}</div>
                                        <div className="text-xs text-slate-500 max-w-xs truncate">{prosumer.address}</div>
                                    </td>
                                    <td className="p-4 whitespace-nowrap">
                                        <div className="text-xs font-medium text-slate-900">{prosumer.email}</div>
                                        <div className="text-xs text-slate-500 font-mono">{prosumer.phone}</div>
                                    </td>
                                    <td className="p-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                            prosumer.status === 'Active' 
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                                : prosumer.status === 'Pending'
                                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                prosumer.status === 'Active' ? 'bg-[#10B981]' : prosumer.status === 'Pending' ? 'bg-[#F59E0B]' : 'bg-rose-500'
                                            }`}></span>
                                            {prosumer.status}
                                        </span>
                                    </td>
                                    <td className="p-4 whitespace-nowrap text-right text-xs font-semibold">
                                        <button 
                                            onClick={() => openForm(prosumer)}
                                            className="text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg mr-2 transition-all cursor-pointer"
                                        >
                                            Edit
                                        </button>
                                        
                                        {prosumer.status === 'Pending' && (
                                            <button 
                                                onClick={() => handleStatusChange(prosumer.nic, 'Active')}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer font-bold"
                                            >
                                                Approve & Activate
                                            </button>
                                        )}
                                        
                                        {prosumer.status === 'Active' && (
                                            <button 
                                                onClick={() => handleStatusChange(prosumer.nic, 'Inactive')}
                                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                                            >
                                                Deactivate
                                            </button>
                                        )}
                                        
                                        {prosumer.status === 'Inactive' && (
                                            <button 
                                                onClick={() => handleStatusChange(prosumer.nic, 'Active')}
                                                className="bg-[#10B981] hover:bg-[#059669] text-white px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold shadow-xs"
                                            >
                                                Reactivate
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
