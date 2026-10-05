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

// Shows a coordinate to 5 decimal places, or a dash when it is missing.
const formatCoordinate = (value) => (typeof value === 'number' ? value.toFixed(5) : '—');

export default function NodeManagement() {
    const canManageHubs = getRole() === 'Backoffice';

    const [nodes, setNodes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Create form state
    const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [searchQuery, setSearchQuery] = useState('');

    // Which node cards have their booking slots panel open
    const [expandedNodeIds, setExpandedNodeIds] = useState(() => new Set());

    // Operating schedule update state
    const [editingScheduleId, setEditingScheduleId] = useState(null);
    const [newSchedule, setNewSchedule] = useState(DEFAULT_SCHEDULE);
    const [isSavingSchedule, setIsSavingSchedule] = useState(false);

    useEffect(() => {
        loadNodes();
    }, []);

    // Loads all hubs from the API.
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

    // Updates a create-form field as the user types.
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Stores the coordinates picked on the map in the create form.
    const handleLocationChange = ({ latitude, longitude }) => {
        setFormData(prev => ({ ...prev, latitude, longitude }));
    };

    const handlePlaceSelected = ({ addressLine, city }) => {
        setFormData(prev => ({
            ...prev,
            addressLine: prev.addressLine || addressLine,
            city: prev.city || city
        }));
    };

    // Registers a new hub from the form and reloads the list.
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

    // Deactivates a hub and reloads the list.
    const handleDeactivate = async (id) => {
        setError('');
        try {
            await deactivateNode(id);
            await loadNodes();
        } catch (err) {
            setError(err.message);
        }
    };

    // Activates a hub and reloads the list.
    const handleActivate = async (id) => {
        setError('');
        try {
            await activateNode(id);
            await loadNodes();
        } catch (err) {
            setError(err.message);
        }
    };

    // Shows or hides a hub's booking slots panel.
    const toggleSlots = (id) => {
        setExpandedNodeIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    // Opens the schedule editor pre-filled with the hub's current hours.
    const startEditingSchedule = (node) => {
        setEditingScheduleId(node.id);
        setNewSchedule(node.operatingSchedule || DEFAULT_SCHEDULE);
    };

    // Saves the edited operating schedule for a hub and reloads the list.
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

    const filteredNodes = nodes.filter(n => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        return (
            (n.stationName && n.stationName.toLowerCase().includes(q)) ||
            (n.stationCode && n.stationCode.toLowerCase().includes(q)) ||
            (n.city && n.city.toLowerCase().includes(q)) ||
            (n.addressLine && n.addressLine.toLowerCase().includes(q))
        );
    });

    if (isLoading && nodes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
                <div className="w-10 h-10 border-4 border-[#F59E0B] border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm font-medium text-slate-500">Loading Solar Grid Hubs...</p>
            </div>
        );
    }

    const inputClass = 'w-full border-slate-200 rounded-xl shadow-xs focus:ring-2 focus:ring-[#F59E0B] focus:outline-none border p-2.5 text-sm bg-white';

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:justify-between md:items-center bg-slate-50/80 gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                        <h2 className="text-xl font-bold text-slate-900">Microgrid Battery Hubs & Nodes</h2>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        {canManageHubs
                            ? 'Register and maintain solar storage nodes, coordinate operating schedules, and manage power trading slots.'
                            : 'Monitor battery hubs, calibrate operating schedules, and inspect real-time bay utilization.'}
                    </p>
                </div>
                {canManageHubs && (
                    <button
                        onClick={() => setIsCreateFormOpen(!isCreateFormOpen)}
                        className="inline-flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#d97706] text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all transform active:scale-95 whitespace-nowrap cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                        {isCreateFormOpen ? 'Close Registration Form' : 'Register New Hub'}
                    </button>
                )}
            </div>

            {/* Search and stats bar */}
            <div className="border-b border-slate-200 bg-white px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                    <span>Total Nodes: <strong className="text-slate-800">{nodes.length}</strong></span>
                    <span>Active Hubs: <strong className="text-emerald-600">{nodes.filter(n => n.status === 'Active').length}</strong></span>
                    <span>Total Capacity: <strong className="text-amber-600">{nodes.reduce((acc, curr) => acc + (curr.capacityKwh || 0), 0)} kWh</strong></span>
                </div>
                <div className="relative min-w-[240px]">
                    <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search hubs by name, code or city..."
                        className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:border-transparent transition-all"
                    />
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6 rounded-r-xl">
                    <p className="text-red-700 text-xs sm:text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Create Form */}
            {canManageHubs && isCreateFormOpen && (
                <div className="p-6 border-b border-slate-200 bg-amber-50/20">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900">Register Solar Grid Hub</h3>
                        </div>
                        <button 
                            onClick={() => setIsCreateFormOpen(false)} 
                            className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                            ✕ Cancel
                        </button>
                    </div>

                    <form onSubmit={handleCreateSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label htmlFor="hub-name" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Hub Name</label>
                            <input required id="hub-name" type="text" minLength={2} maxLength={100} name="stationName" value={formData.stationName} onChange={handleInputChange} className={inputClass} placeholder="e.g. Galle South Hub" />
                        </div>
                        <div>
                            <label htmlFor="hub-code" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Station Code</label>
                            <input required id="hub-code" type="text" minLength={2} maxLength={20} name="stationCode" value={formData.stationCode} onChange={handleInputChange} className={`${inputClass} uppercase`} placeholder="e.g. GAL-01" />
                        </div>
                        <div>
                            <label htmlFor="hub-capacity" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Capacity (kW/h)</label>
                            <input required id="hub-capacity" type="number" min="0.01" step="any" name="capacityKwh" value={formData.capacityKwh} onChange={handleInputChange} className={inputClass} placeholder="e.g. 50" />
                        </div>
                        <div>
                            <label htmlFor="hub-bays" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Battery Bays</label>
                            <input required id="hub-bays" type="number" min="1" max="1000" name="totalBays" value={formData.totalBays} onChange={handleInputChange} className={inputClass} placeholder="e.g. 5" />
                        </div>
                        <fieldset className="md:col-span-2 lg:col-span-4">
                            <legend className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Operating Schedule</legend>
                            <TimeRangePicker value={formData.operatingSchedule} onChange={(operatingSchedule) => setFormData(prev => ({ ...prev, operatingSchedule }))} />
                        </fieldset>
                        <fieldset className="md:col-span-2 lg:col-span-4">
                            <legend className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">GPS Location & Coordinate Map</legend>
                            <LocationPicker latitude={formData.latitude} longitude={formData.longitude} onChange={handleLocationChange} onPlaceSelected={handlePlaceSelected} />
                        </fieldset>
                        <div className="md:col-span-2 lg:col-span-3">
                            <label htmlFor="hub-address" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Address Line</label>
                            <input required id="hub-address" type="text" name="addressLine" value={formData.addressLine} onChange={handleInputChange} className={inputClass} placeholder="e.g. 12 Lighthouse Street" />
                        </div>
                        <div className="md:col-span-2 lg:col-span-1">
                            <label htmlFor="hub-city" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">City</label>
                            <input required id="hub-city" type="text" name="city" value={formData.city} onChange={handleInputChange} className={inputClass} placeholder="e.g. Galle" />
                        </div>
                        <div className="flex justify-end md:col-span-2 lg:col-span-4 gap-2.5 mt-2">
                            <button
                                type="button"
                                onClick={() => setIsCreateFormOpen(false)}
                                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 bg-white hover:bg-slate-50 text-sm font-semibold transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={isSubmitting} 
                                className="px-6 py-2 bg-[#F59E0B] text-slate-950 font-bold rounded-xl hover:bg-[#d97706] text-sm shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                            >
                                {isSubmitting ? 'Registering Hub...' : 'Submit & Register Hub'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Nodes Grid */}
            <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredNodes.map(node => (
                        <div 
                            key={node.id} 
                            className={`border border-slate-200 rounded-2xl p-6 shadow-xs bg-white hover:shadow-md transition-all flex flex-col relative ${
                                expandedNodeIds.has(node.id) ? 'lg:col-span-2 bg-slate-50/30' : ''
                            }`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 font-bold text-xs">
                                            ⚡
                                        </div>
                                        <div>
                                            <h3 className="text-base sm:text-lg font-bold text-slate-900">{node.stationName}</h3>
                                            <p className="text-xs text-slate-400 font-mono">{node.stationCode}</p>
                                        </div>
                                    </div>
                                </div>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                    node.status === 'Active' 
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${node.status === 'Active' ? 'bg-[#10B981]' : 'bg-rose-500'}`}></span>
                                    {node.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs mb-4 flex-grow bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                                <div className="col-span-2">
                                    <span className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">Location</span>
                                    <span className="font-semibold text-slate-800">{[node.addressLine, node.city].filter(Boolean).join(', ') || '—'}</span>
                                </div>
                                <div>
                                    <span className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">GPS Coordinates</span>
                                    <span className="font-mono font-medium text-slate-700">{formatCoordinate(node.latitude)}, {formatCoordinate(node.longitude)}</span>
                                </div>
                                <div>
                                    <span className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">Battery Capacity</span>
                                    <span className="font-bold text-amber-600">{node.capacityKwh} kW/h</span>
                                </div>
                                <div>
                                    <span className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">Bays Installed</span>
                                    <span className="font-semibold text-slate-800">{node.totalBays} Charging Bays</span>
                                </div>
                            </div>

                            {/* Schedule Section */}
                            <div className="border-t border-slate-100 pt-3 mb-3">
                                <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Operating Window</span>
                                {editingScheduleId === node.id ? (
                                    <form onSubmit={(e) => handleSaveSchedule(e, node.id)} className="space-y-2">
                                        <TimeRangePicker value={newSchedule} onChange={setNewSchedule} />
                                        <div className="flex justify-end gap-2 mt-2">
                                            <button 
                                                type="button" 
                                                onClick={() => setEditingScheduleId(null)} 
                                                className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="submit" 
                                                disabled={isSavingSchedule} 
                                                className="bg-[#10B981] hover:bg-[#059669] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                                            >
                                                {isSavingSchedule ? 'Saving...' : 'Save Window'}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100">
                                        <span className={`text-xs font-mono font-bold ${node.operatingSchedule ? 'text-slate-800' : 'text-slate-400'}`}>
                                            ⏰ {node.operatingSchedule ? node.operatingSchedule.replace('-', ' – ') : 'Not configured'}
                                        </span>
                                        <button 
                                            onClick={() => startEditingSchedule(node)} 
                                            className="text-amber-600 hover:text-amber-700 font-bold text-xs hover:underline cursor-pointer"
                                        >
                                            Adjust Schedule
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Booking slots inside this node */}
                            <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                                <span className="text-xs font-bold text-slate-600">Trading Slots & Reservations</span>
                                <button
                                    onClick={() => toggleSlots(node.id)}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                                >
                                    <span>{expandedNodeIds.has(node.id) ? '▲ Hide Slots' : '▼ Manage Slots'}</span>
                                </button>
                            </div>

                            {expandedNodeIds.has(node.id) && (
                                <div className="mt-4 pt-4 border-t border-slate-200">
                                    <SlotManager node={node} canManage={canManageHubs} />
                                </div>
                            )}

                            {/* Node Lifecycle Actions */}
                            {canManageHubs && (
                                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                                    {node.status === 'Active' ? (
                                        <button
                                            onClick={() => handleDeactivate(node.id)}
                                            className="text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                        >
                                            Deactivate Hub
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleActivate(node.id)}
                                            className="text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                        >
                                            Activate Hub
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {filteredNodes.length === 0 && (
                        <div className="col-span-full p-12 text-center text-slate-500 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                            <p className="font-semibold text-slate-800">No solar grid nodes found</p>
                            <p className="text-xs text-slate-400 mt-1">
                                {searchQuery ? `No matches for "${searchQuery}"` : 'Register a new hub using the button above.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
