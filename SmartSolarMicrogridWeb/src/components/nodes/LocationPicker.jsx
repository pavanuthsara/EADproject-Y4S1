import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// GPS picker for hub registration: click the map (or drag the pin) to set
// coordinates, search an address to jump to a region, or use the browser's
// geolocation. Map tiles and address search come from OpenStreetMap, so no API
// key is needed. Nominatim's usage policy allows at most one search per second,
// which handleSearch enforces.

const DEFAULT_CENTER = [7.8731, 80.7718]; // Sri Lanka
const DEFAULT_ZOOM = 7;
const PIN_ZOOM = 15;
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const MIN_SEARCH_INTERVAL_MS = 1000;

// Inline SVG pin: avoids Leaflet's default marker images, which break under Vite bundling.
const pinIcon = L.divIcon({
    className: '',
    html: `<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 1C7.7 1 1 7.6 1 15.8 1 27 16 41 16 41s15-14 15-25.2C31 7.6 24.3 1 16 1z" fill="#F59E0B" stroke="#fff" stroke-width="2"/>
        <circle cx="16" cy="15.5" r="5.5" fill="#0F172A"/>
    </svg>`,
    iconSize: [32, 42],
    iconAnchor: [16, 41],
});

const round6 = (n) => Number(n.toFixed(6));

function parseCoordinates(latitude, longitude) {
    if (latitude === '' || longitude === '') return null;
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return [lat, lng];
}

// Turns a Nominatim address breakdown into the hub's address line and city.
function toAddress(result) {
    const a = result.address ?? {};
    const street = [a.house_number, a.road].filter(Boolean).join(' ');
    return {
        addressLine: street || a.neighbourhood || a.suburb || result.name || '',
        city: a.city || a.town || a.village || a.municipality || a.county || '',
    };
}

function MapClickHandler({ onPick }) {
    useMapEvents({
        click: (e) => onPick(e.latlng.lat, e.latlng.lng),
    });
    return null;
}

// Moves the viewport whenever a new target is requested (search, geolocation, typed coordinates).
function MapViewController({ target }) {
    const map = useMap();
    useEffect(() => {
        if (!target) return;
        if (target.bounds) {
            map.flyToBounds(target.bounds, { maxZoom: PIN_ZOOM });
        } else {
            map.flyTo(target.center, Math.max(map.getZoom(), PIN_ZOOM));
        }
    }, [map, target]);
    return null;
}

// onPlaceSelected (optional) receives { addressLine, city } when a search result is chosen.
export default function LocationPicker({ latitude, longitude, onChange, onPlaceSelected }) {
    const position = parseCoordinates(latitude, longitude);

    const [viewTarget, setViewTarget] = useState(null);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [message, setMessage] = useState(null); // { text, tone: 'info' | 'warn' }
    const searchAbortRef = useRef(null);
    const lastSearchAtRef = useRef(0);

    useEffect(() => () => searchAbortRef.current?.abort(), []);

    const setPin = (lat, lng) => onChange({ latitude: String(round6(lat)), longitude: String(round6(lng)) });

    // Direct map interaction supersedes any earlier search/geolocation notice.
    const pickOnMap = (lat, lng) => {
        setMessage(null);
        setPin(lat, lng);
    };

    const handleSearch = async () => {
        const q = query.trim();
        if (!q) return;
        searchAbortRef.current?.abort();
        const controller = new AbortController();
        searchAbortRef.current = controller;

        setIsSearching(true);
        setMessage(null);
        setResults([]);
        try {
            const wait = lastSearchAtRef.current + MIN_SEARCH_INTERVAL_MS - Date.now();
            if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait));
            if (controller.signal.aborted) return;
            lastSearchAtRef.current = Date.now();

            const params = new URLSearchParams({ q, format: 'jsonv2', limit: '5', addressdetails: '1' });
            const res = await fetch(`${NOMINATIM_URL}?${params}`, {
                signal: controller.signal,
                headers: { Accept: 'application/json' },
            });
            if (!res.ok) throw new Error(`Search failed (${res.status})`);
            const data = await res.json();
            if (data.length === 0) setMessage({ text: `No places found for "${q}".`, tone: 'warn' });
            setResults(data);
        } catch (err) {
            if (err.name !== 'AbortError') setMessage({ text: 'Address search is unavailable right now. Click the map to place the pin instead.', tone: 'warn' });
        } finally {
            if (searchAbortRef.current === controller) setIsSearching(false);
        }
    };

    const selectResult = (result) => {
        const lat = Number(result.lat);
        const lng = Number(result.lon);
        setPin(lat, lng);
        // Nominatim boundingbox is [south, north, west, east] as strings.
        const [s, n, w, e] = (result.boundingbox ?? []).map(Number);
        setViewTarget(result.boundingbox ? { bounds: [[s, w], [n, e]] } : { center: [lat, lng] });
        setResults([]);
        setQuery(result.display_name);
        onPlaceSelected?.(toAddress(result));
        setMessage({ text: 'Pin placed at the search result. Click the map or drag the pin to fine-tune.', tone: 'info' });
    };

    const handleUseCurrentLocation = () => {
        if (!('geolocation' in navigator)) {
            setMessage({ text: 'Your browser does not support location access.', tone: 'warn' });
            return;
        }
        setIsLocating(true);
        setMessage(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setIsLocating(false);
                setPin(pos.coords.latitude, pos.coords.longitude);
                setViewTarget({ center: [pos.coords.latitude, pos.coords.longitude] });
            },
            (err) => {
                setIsLocating(false);
                setMessage({
                    text: err.code === err.PERMISSION_DENIED
                        ? 'Location permission was denied. Allow it in your browser settings, or place the pin manually.'
                        : 'Could not determine your current location. Place the pin manually.',
                    tone: 'warn',
                });
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleCoordinateChange = (e) => {
        const { name, value } = e.target;
        onChange({ latitude, longitude, [name]: value });
    };

    // Re-centre on manually typed coordinates once the user leaves the field.
    const handleCoordinateBlur = () => {
        if (position) setViewTarget({ center: position });
    };

    const inputClass = 'w-full border-gray-300 rounded-md border p-2';
    const secondaryButtonClass = 'px-3 py-2 rounded-md text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap';

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label htmlFor="hub-latitude" className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Latitude</label>
                    <input required id="hub-latitude" type="number" step="any" min="-90" max="90" name="latitude" value={latitude} onChange={handleCoordinateChange} onBlur={handleCoordinateBlur} className={`${inputClass} font-mono`} placeholder="e.g. 6.0535" />
                </div>
                <div>
                    <label htmlFor="hub-longitude" className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Longitude</label>
                    <input required id="hub-longitude" type="number" step="any" min="-180" max="180" name="longitude" value={longitude} onChange={handleCoordinateChange} onBlur={handleCoordinateBlur} className={`${inputClass} font-mono`} placeholder="e.g. 80.2210" />
                </div>
            </div>

            <div className="border border-gray-300 rounded-md bg-white overflow-hidden">
                {/* Map toolbar */}
                <div className="relative p-2 border-b border-gray-200 flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-grow flex gap-2">
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            // Enter would otherwise submit the whole registration form.
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
                            className={inputClass}
                            placeholder="Search by address, e.g. Galle Fort"
                            aria-label="Search by address"
                        />
                        <button type="button" onClick={handleSearch} disabled={isSearching || !query.trim()} className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#F59E0B] text-slate-950 hover:bg-[#d97706] disabled:opacity-50 transition-all cursor-pointer">
                            {isSearching ? 'Searching...' : 'Search'}
                        </button>
                        {results.length > 0 && (
                            <ul className="absolute left-0 right-0 top-full mt-1 z-10 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {results.map(result => (
                                    <li key={result.place_id}>
                                        <button type="button" onClick={() => selectResult(result)} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50">
                                            {result.display_name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <button type="button" onClick={handleUseCurrentLocation} disabled={isLocating} className={secondaryButtonClass}>
                        {isLocating ? 'Locating...' : '◎ Use Current Location'}
                    </button>
                </div>

                {/* isolate keeps Leaflet's high z-index panes from covering the rest of the page */}
                <div className="relative isolate h-72 md:h-80">
                    <MapContainer center={position ?? DEFAULT_CENTER} zoom={position ? PIN_ZOOM : DEFAULT_ZOOM} className="h-full w-full cursor-crosshair">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapClickHandler onPick={pickOnMap} />
                        <MapViewController target={viewTarget} />
                        {position && (
                            <Marker
                                position={position}
                                icon={pinIcon}
                                draggable
                                eventHandlers={{ dragend: (e) => { const { lat, lng } = e.target.getLatLng(); pickOnMap(lat, lng); } }}
                            />
                        )}
                    </MapContainer>
                </div>

                <p className={`px-3 py-2 text-xs border-t border-gray-200 ${message?.tone === 'warn' ? 'text-amber-700 bg-amber-50' : 'text-gray-500 bg-gray-50'}`}>
                    {message?.text || (position
                        ? 'Pin set. Click elsewhere on the map or drag the pin to adjust.'
                        : 'Click anywhere on the map to drop a pin and fill in the coordinates.')}
                </p>
            </div>
        </div>
    );
}
