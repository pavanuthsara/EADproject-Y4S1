import React, { useState, useEffect } from 'react';
import { getNodes, createNode, updateNodeSchedule, deactivateNode, activateNode } from '../../services/nodeService';
import TimeRangePicker from './TimeRangePicker';
import LocationPicker from './LocationPicker';

const EMPTY_FORM = {
    name: '',
    latitude: '',
    longitude: '',
    capacity: '',
    batterySlots: '',
    schedule: '06:00-18:00'
};

export default function NodeManagement() {
    const [nodes, setNodes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Create form state
    const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState(EMPTY_FORM);

    // Schedule update state
    const [editingScheduleId, setEditingScheduleId] = useState(null);
    const [newScheduleStr, setNewScheduleStr] = useState('');

    useEffect(() => {
        loadNodes();
    }, []);

    const loadNodes = async () => {
        setIsLoading(true);
        try {
            const data = await getNodes();
            setNodes(data);
            setError('');
        } catch (err) {
            setError('Failed to load microgrid nodes.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLocationChange = ({ latitude, longitude }) => {
        setFormData(prev => ({ ...prev, latitude, longitude }));
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            await createNode({
                name: formData.name,
                gpsLocation: `${formData.latitude}, ${formData.longitude}`,
                capacity: Number(formData.capacity),
                batterySlots: Number(formData.batterySlots),
                schedule: formData.schedule
            });
            await loadNodes();
            setIsCreateFormOpen(false);
            setFormData(EMPTY_FORM);
        } catch (err) {
            setError(err.message || 'Error creating node.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeactivate = async (id) => {
        setError('');
        try {
            await deactivateNode(id);
            await loadNodes();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleActivate = async (id) => {
        setError('');
        try {
            await activateNode(id);
            await loadNodes();
        } catch (err) {
            setError(err.message);
        }
    };

    const startEditingSchedule = (node) => {
        setEditingScheduleId(node.id);
        setNewScheduleStr(node.schedule);
    };

    const handleSaveSchedule = async (id) => {
        setError('');
        try {
            await updateNodeSchedule(id, newScheduleStr);
            setEditingScheduleId(null);
            await loadNodes();
        } catch (err) {
            setError(err.message || 'Error updating schedule.');
        }
    };

    if (isLoading && nodes.length === 0) {
        return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:justify-between md:items-center bg-gray-50 gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">Microgrid Node Management</h2>
                    <p className="text-sm text-gray-500 mt-1">Register solar hubs, manage capacity, and update operational schedules.</p>
                </div>
                <button 
                    onClick={() => setIsCreateFormOpen(!isCreateFormOpen)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm whitespace-nowrap"
                >
                    {isCreateFormOpen ? 'Cancel Registration' : '+ Register New Hub'}
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Create Form */}
            {isCreateFormOpen && (
                <div className="p-6 border-b border-gray-200 bg-indigo-50/30">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Register Solar Grid Hub</h3>
                    <form onSubmit={handleCreateSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hub Name</label>
                            <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full border-gray-300 rounded-md border p-2" placeholder="e.g. Galle South Hub" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (kW/h)</label>
                            <input required type="number" min="1" name="capacity" value={formData.capacity} onChange={handleInputChange} className="w-full border-gray-300 rounded-md border p-2" placeholder="e.g. 50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Battery Slots</label>
                            <input required type="number" min="0" name="batterySlots" value={formData.batterySlots} onChange={handleInputChange} className="w-full border-gray-300 rounded-md border p-2" placeholder="e.g. 5" />
                        </div>
                        <fieldset className="md:col-span-2 lg:col-span-3">
                            <legend className="block text-sm font-medium text-gray-700 mb-1">Operating Schedule</legend>
                            <TimeRangePicker value={formData.schedule} onChange={(schedule) => setFormData(prev => ({ ...prev, schedule }))} />
                        </fieldset>
                        <fieldset className="md:col-span-2 lg:col-span-3">
                            <legend className="block text-sm font-medium text-gray-700 mb-1">GPS Location</legend>
                            <LocationPicker latitude={formData.latitude} longitude={formData.longitude} onChange={handleLocationChange} />
                        </fieldset>
                        <div className="flex justify-end md:col-span-2 lg:col-span-3">
                            <button type="submit" disabled={isSubmitting} className="w-full md:w-auto md:min-w-48 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
                                {isSubmitting ? 'Registering...' : 'Submit Hub'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Nodes Table */}
            <div className="overflow-x-auto p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {nodes.map(node => (
                        <div key={node.id} className="border border-gray-200 rounded-lg p-5 shadow-sm bg-white flex flex-col relative">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{node.name}</h3>
                                    <p className="text-xs text-gray-500 font-mono mt-1">ID: {node.id}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${node.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {node.status}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm mb-4 flex-grow">
                                <div>
                                    <span className="block text-gray-500 text-xs uppercase tracking-wider">GPS</span>
                                    <span className="font-medium">{node.gpsLocation}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-xs uppercase tracking-wider">Capacity</span>
                                    <span className="font-medium">{node.capacity} kW/h</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-xs uppercase tracking-wider">Battery Slots</span>
                                    <span className="font-medium">{node.batterySlots}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-xs uppercase tracking-wider">Active Rsrv.</span>
                                    <span className="font-medium">{node.activeReservations}</span>
                                </div>
                            </div>

                            {/* Schedule Section */}
                            <div className="border-t border-gray-100 pt-4 mb-4">
                                <span className="block text-gray-500 text-xs uppercase tracking-wider mb-1">Schedule</span>
                                {editingScheduleId === node.id ? (
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={newScheduleStr} 
                                            onChange={(e) => setNewScheduleStr(e.target.value)} 
                                            className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                                        />
                                        <button onClick={() => handleSaveSchedule(node.id)} className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700">Save</button>
                                        <button onClick={() => setEditingScheduleId(null)} className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300">Cancel</button>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-gray-800">{node.schedule}</span>
                                        <button onClick={() => startEditingSchedule(node)} className="text-indigo-600 text-sm hover:underline">Edit</button>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="mt-auto flex justify-end">
                                {node.status === 'Active' ? (
                                    <button 
                                        onClick={() => handleDeactivate(node.id)} 
                                        className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded text-sm font-medium transition-colors"
                                    >
                                        Deactivate Node
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleActivate(node.id)} 
                                        className="text-green-600 hover:bg-green-50 px-3 py-1.5 rounded text-sm font-medium transition-colors"
                                    >
                                        Activate Node
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {nodes.length === 0 && (
                        <div className="col-span-full p-8 text-center text-gray-500">
                            No microgrid nodes registered yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
