import React, { useState, useEffect } from 'react';
import { getNodes, createNode, updateNodeOperatingSchedule, deactivateNode, activateNode } from '../../services/nodeService';
import { getRole } from '../../services/authService';
import TimeRangePicker from './TimeRangePicker';
import LocationPicker from './LocationPicker';
import SlotManager from './SlotManager';

const DEFAULT_SCHEDULE = '06:00-18:00';

const EMPTY_FORM = {
    stationName: '',
    stationCode: '',
    latitude: '',
    longitude: '',
    addressLine: '',
    city: '',
    capacityKwh: '',
    totalBays: '',
    operatingSchedule: DEFAULT_SCHEDULE
};

const formatCoordinate = (value) => (typeof value === 'number' ? value.toFixed(5) : '—');

export default function NodeManagement() {
    // Registering, activating and deactivating hubs are Backoffice-only in the API;
    // Grid Operators can view hubs and change their operating hours.
    const canManageHubs = getRole() === 'Backoffice';

    const [nodes, setNodes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Create form state
    const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState(EMPTY_FORM);

    // Which node cards have their booking slots panel open
    const [expandedNodeIds, setExpandedNodeIds] = useState(() => new Set());

    // Operating schedule update state
    const [editingScheduleId, setEditingScheduleId] = useState(null);
    const [newSchedule, setNewSchedule] = useState(DEFAULT_SCHEDULE);
    const [isSavingSchedule, setIsSavingSchedule] = useState(false);

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
            setError(err.message || 'Failed to load microgrid nodes.');
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

    // Pre-fill the address from a map search result, without overwriting anything typed.
    const handlePlaceSelected = ({ addressLine, city }) => {
        setFormData(prev => ({
            ...prev,
            addressLine: prev.addressLine || addressLine,
            city: prev.city || city
        }));
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            await createNode({
                stationName: formData.stationName,
                stationCode: formData.stationCode,
                latitude: Number(formData.latitude),
                longitude: Number(formData.longitude),
                addressLine: formData.addressLine,
                city: formData.city,
                capacityKwh: Number(formData.capacityKwh),
                totalBays: Number(formData.totalBays),
                operatingSchedule: formData.operatingSchedule
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

    const toggleSlots = (id) => {
        setExpandedNodeIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const startEditingSchedule = (node) => {
        setEditingScheduleId(node.id);
        setNewSchedule(node.operatingSchedule || DEFAULT_SCHEDULE);
    };

    const handleSaveSchedule = async (e, id) => {
        e.preventDefault();
        setError('');
        setIsSavingSchedule(true);
        try {
            await updateNodeOperatingSchedule(id, newSchedule);
            setEditingScheduleId(null);
            await loadNodes();
        } catch (err) {
            setError(err.message || 'Error updating schedule.');
        } finally {
            setIsSavingSchedule(false);
        }
    };

    if (isLoading && nodes.length === 0) {
        return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
    }

    const inputClass = 'w-full border-gray-300 rounded-md border p-2';

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:justify-between md:items-center bg-gray-50 gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">Microgrid Node Management</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {canManageHubs
                            ? 'Register solar hubs (batteries), then add the booking slots prosumers can reserve inside each hub.'
                            : 'View solar hubs, open or close their booking slots, and handle reservations.'}
                    </p>
                </div>
                {canManageHubs && (
                    <button
                        onClick={() => setIsCreateFormOpen(!isCreateFormOpen)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm whitespace-nowrap"
                    >
                        {isCreateFormOpen ? 'Cancel Registration' : '+ Register New Hub'}
                    </button>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Create Form */}
            {canManageHubs && isCreateFormOpen && (
                <div className="p-6 border-b border-gray-200 bg-indigo-50/30">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Register Solar Grid Hub</h3>
                    <form onSubmit={handleCreateSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label htmlFor="hub-name" className="block text-sm font-medium text-gray-700 mb-1">Hub Name</label>
                            <input required id="hub-name" type="text" minLength={2} maxLength={100} name="stationName" value={formData.stationName} onChange={handleInputChange} className={inputClass} placeholder="e.g. Galle South Hub" />
                        </div>
                        <div>
                            <label htmlFor="hub-code" className="block text-sm font-medium text-gray-700 mb-1">Station Code</label>
                            <input required id="hub-code" type="text" minLength={2} maxLength={20} name="stationCode" value={formData.stationCode} onChange={handleInputChange} className={`${inputClass} uppercase`} placeholder="e.g. GAL-01" />
                        </div>
                        <div>
                            <label htmlFor="hub-capacity" className="block text-sm font-medium text-gray-700 mb-1">Capacity (kW/h)</label>
                            <input required id="hub-capacity" type="number" min="0.01" step="any" name="capacityKwh" value={formData.capacityKwh} onChange={handleInputChange} className={inputClass} placeholder="e.g. 50" />
                        </div>
                        <div>
                            <label htmlFor="hub-bays" className="block text-sm font-medium text-gray-700 mb-1">Battery Bays</label>
                            <input required id="hub-bays" type="number" min="1" max="1000" name="totalBays" value={formData.totalBays} onChange={handleInputChange} className={inputClass} placeholder="e.g. 5" />
                        </div>
                        <fieldset className="md:col-span-2 lg:col-span-4">
                            <legend className="block text-sm font-medium text-gray-700 mb-1">Operating Schedule</legend>
                            <TimeRangePicker value={formData.operatingSchedule} onChange={(operatingSchedule) => setFormData(prev => ({ ...prev, operatingSchedule }))} />
                        </fieldset>
                        <fieldset className="md:col-span-2 lg:col-span-4">
                            <legend className="block text-sm font-medium text-gray-700 mb-1">GPS Location</legend>
                            <LocationPicker latitude={formData.latitude} longitude={formData.longitude} onChange={handleLocationChange} onPlaceSelected={handlePlaceSelected} />
                        </fieldset>
                        <div className="md:col-span-2 lg:col-span-3">
                            <label htmlFor="hub-address" className="block text-sm font-medium text-gray-700 mb-1">Address Line</label>
                            <input required id="hub-address" type="text" name="addressLine" value={formData.addressLine} onChange={handleInputChange} className={inputClass} placeholder="e.g. 12 Lighthouse Street" />
                        </div>
                        <div className="md:col-span-2 lg:col-span-1">
                            <label htmlFor="hub-city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <input required id="hub-city" type="text" name="city" value={formData.city} onChange={handleInputChange} className={inputClass} placeholder="e.g. Galle" />
                        </div>
                        <div className="flex justify-end md:col-span-2 lg:col-span-4">
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
                        <div key={node.id} className={`border border-gray-200 rounded-lg p-5 shadow-sm bg-white flex flex-col relative ${expandedNodeIds.has(node.id) ? 'lg:col-span-2' : ''}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{node.stationName}</h3>
                                    <p className="text-xs text-gray-500 font-mono mt-1">{node.stationCode}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${node.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {node.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm mb-4 flex-grow">
                                <div className="col-span-2">
                                    <span className="block text-gray-500 text-xs uppercase tracking-wider">Address</span>
                                    <span className="font-medium">{[node.addressLine, node.city].filter(Boolean).join(', ') || '—'}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-xs uppercase tracking-wider">GPS</span>
                                    <span className="font-medium font-mono">{formatCoordinate(node.latitude)}, {formatCoordinate(node.longitude)}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-xs uppercase tracking-wider">Capacity</span>
                                    <span className="font-medium">{node.capacityKwh} kW/h</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-xs uppercase tracking-wider">Battery Bays</span>
                                    <span className="font-medium">{node.totalBays}</span>
                                </div>
                            </div>

                            {/* Schedule Section */}
                            <div className="border-t border-gray-100 pt-4 mb-4">
                                <span className="block text-gray-500 text-xs uppercase tracking-wider mb-1">Operating Schedule</span>
                                {editingScheduleId === node.id ? (
                                    // A form so the picker's native validity blocks saving an inverted window.
                                    <form onSubmit={(e) => handleSaveSchedule(e, node.id)} className="space-y-2">
                                        <TimeRangePicker value={newSchedule} onChange={setNewSchedule} />
                                        <div className="flex justify-end gap-2">
                                            <button type="button" onClick={() => setEditingScheduleId(null)} className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300">Cancel</button>
                                            <button type="submit" disabled={isSavingSchedule} className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 disabled:opacity-50">
                                                {isSavingSchedule ? 'Saving...' : 'Save'}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="flex justify-between items-center">
                                        <span className={`font-medium font-mono ${node.operatingSchedule ? 'text-gray-800' : 'text-gray-400'}`}>
                                            {node.operatingSchedule ? node.operatingSchedule.replace('-', ' – ') : 'Not set'}
                                        </span>
                                        <button onClick={() => startEditingSchedule(node)} className="text-indigo-600 text-sm hover:underline">Edit</button>
                                    </div>
                                )}
                            </div>

                            {/* Booking slots inside this node */}
                            <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                                <span className="text-sm text-gray-600">Booking slots</span>
                                <button
                                    onClick={() => toggleSlots(node.id)}
                                    className="text-indigo-600 text-sm font-medium hover:underline"
                                >
                                    {expandedNodeIds.has(node.id) ? 'Hide slots' : 'Manage slots'}
                                </button>
                            </div>
                            {expandedNodeIds.has(node.id) && (
                                <SlotManager node={node} canManage={canManageHubs} />
                            )}

                            {/* Actions */}
                            {canManageHubs && (
                                <div className="mt-4 flex justify-end">
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
                            )}
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
