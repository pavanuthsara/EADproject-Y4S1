import React, { useState, useEffect } from 'react';
import { getProsumers, createProsumer, updateProsumer, toggleProsumerStatus } from '../../services/prosumerService';

export default function ProsumerManagement() {
    const [prosumers, setProsumers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingNic, setEditingNic] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
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

    const handleToggleStatus = async (nic) => {
        try {
            await toggleProsumerStatus(nic);
            await loadProsumers();
        } catch (err) {
            alert('Failed to update status.');
        }
    };

    if (isLoading && prosumers.length === 0) {
        return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header Section */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">Prosumer Management</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage user profiles, update details, and toggle active status.</p>
                </div>
                <button 
                    onClick={() => openForm()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm"
                >
                    + Add Prosumer
                </button>
            </div>

            {/* Error Message Display */}
            {error && !isFormOpen && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Form Section (Conditional) */}
            {isFormOpen && (
                <div className="p-6 border-b border-gray-200 bg-indigo-50/30">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-800">
                            {editingNic ? `Edit Prosumer: ${editingNic}` : 'Create New Prosumer'}
                        </h3>
                        <button onClick={closeForm} className="text-gray-500 hover:text-gray-700">
                            ✕ Close
                        </button>
                    </div>
                    
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">NIC (Primary Key)</label>
                            <input 
                                required
                                type="text"
                                name="nic"
                                value={formData.nic}
                                onChange={handleInputChange}
                                disabled={!!editingNic} // NIC cannot be changed if editing
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-2 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                                placeholder="e.g. 199012345678"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input 
                                required
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-2 bg-white"
                                placeholder="John Doe"
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
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-2 bg-white"
                                placeholder="john@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input 
                                required
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-2 bg-white"
                                placeholder="07XXXXXXXX"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <textarea 
                                required
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                rows="2"
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-2 bg-white"
                                placeholder="123 Street, City"
                            ></textarea>
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                            <button 
                                type="button" 
                                onClick={closeForm}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 font-medium"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium disabled:opacity-50"
                            >
                                {isSubmitting ? 'Saving...' : (editingNic ? 'Update Prosumer' : 'Create Prosumer')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Data Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">NIC</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {prosumers.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-gray-500">
                                    No prosumers found. Add one to get started.
                                </td>
                            </tr>
                        ) : (
                            prosumers.map((prosumer) => (
                                <tr key={prosumer.nic} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {prosumer.nic}
                                    </td>
                                    <td className="p-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{prosumer.name}</div>
                                        <div className="text-xs text-gray-500">{prosumer.address}</div>
                                    </td>
                                    <td className="p-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{prosumer.email}</div>
                                        <div className="text-xs text-gray-500">{prosumer.phone}</div>
                                    </td>
                                    <td className="p-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            prosumer.status === 'Active' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {prosumer.status}
                                        </span>
                                    </td>
                                    <td className="p-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button 
                                            onClick={() => openForm(prosumer)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => handleToggleStatus(prosumer.nic)}
                                            className={`${prosumer.status === 'Active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                                        >
                                            {prosumer.status === 'Active' ? 'Deactivate' : 'Activate'}
                                        </button>
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
