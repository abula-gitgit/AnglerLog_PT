import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { 
  MapPin, Navigation, Search, Globe, RefreshCw, 
  Check, AlertCircle, Crosshair, ChevronDown, ChevronUp, Layers
} from 'lucide-react';

interface SpotLocationPickerProps {
  lat: number;
  lng: number;
  onChange: (coords: { lat: number; lng: number; suggestedName?: string }) => void;
  onSwitchToFullMap?: () => void;
}

interface SearchCandidate {
  display_name: string;
  name: string;
  lat: string;
  lon: string;
}

export const SpotLocationPicker: React.FC<SpotLocationPickerProps> = ({
  lat,
  lng,
  onChange,
  onSwitchToFullMap,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [mapStyle, setMapStyle] = useState<'standard' | 'satellite'>('standard');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<SearchCandidate[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [showManualCoords, setShowManualCoords] = useState<boolean>(false);
  const [reverseAddress, setReverseAddress] = useState<string>('');

  // Tile layers
  const standardTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const satelliteTileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

  // Create custom pin icon
  const createPinIcon = () => {
    return L.divIcon({
      className: 'custom-spot-picker-marker',
      html: `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 36px; height: 36px; border-radius: 9999px; background-color: rgba(14, 165, 233, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 30px; height: 30px; border-radius: 9999px; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); border: 2.5px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  };

  // Reverse geocode to show human-readable address
  const fetchReverseAddress = useCallback(async (targetLat: number, targetLng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${targetLat}&lon=${targetLng}&zoom=14&addressdetails=1`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const parts = data.display_name.split(', ');
          const shortAddr = parts.slice(0, 3).reverse().join(' ');
          setReverseAddress(shortAddr || data.display_name);
        }
      }
    } catch {
      // Ignore background reverse geocode failure
    }
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLat = Number.isFinite(lat) && lat !== 0 ? lat : 35.1328;
    const initialLng = Number.isFinite(lng) && lng !== 0 ? lng : 139.6135;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: true,
      attributionControl: false,
    });

    const tileUrl = mapStyle === 'satellite' ? satelliteTileUrl : standardTileUrl;
    const tileLayer = L.tileLayer(tileUrl, { maxZoom: 18 });
    tileLayer.addTo(map);

    tileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    // Draggable Marker
    const marker = L.marker([initialLat, initialLng], {
      icon: createPinIcon(),
      draggable: true,
    }).addTo(map);

    markerRef.current = marker;

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      const roundedLat = Math.round(pos.lat * 100000) / 100000;
      const roundedLng = Math.round(pos.lng * 100000) / 100000;
      onChange({ lat: roundedLat, lng: roundedLng });
      fetchReverseAddress(roundedLat, roundedLng);
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      const clickedLat = Math.round(e.latlng.lat * 100000) / 100000;
      const clickedLng = Math.round(e.latlng.lng * 100000) / 100000;
      marker.setLatLng([clickedLat, clickedLng]);
      onChange({ lat: clickedLat, lng: clickedLng });
      fetchReverseAddress(clickedLat, clickedLng);
    });

    fetchReverseAddress(initialLat, initialLng);

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync Map style changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const tileUrl = mapStyle === 'satellite' ? satelliteTileUrl : standardTileUrl;
    tileLayerRef.current.setUrl(tileUrl);
  }, [mapStyle]);

  // Sync marker position when lat/lng change from outside (e.g. GPS, search or manual input)
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const currentPos = markerRef.current.getLatLng();
    if (Math.abs(currentPos.lat - lat) > 0.00001 || Math.abs(currentPos.lng - lng) > 0.00001) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.panTo([lat, lng]);
    }
  }, [lat, lng]);

  // GPS Current Location Button Handler
  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Your device or browser does not support GPS geolocation.');
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const newLat = Math.round(pos.coords.latitude * 100000) / 100000;
        const newLng = Math.round(pos.coords.longitude * 100000) / 100000;

        onChange({ lat: newLat, lng: newLng });
        fetchReverseAddress(newLat, newLng);

        if (mapInstanceRef.current && markerRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
          mapInstanceRef.current.flyTo([newLat, newLng], 16, { animate: true, duration: 1 });
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('Location access was denied. Please enable location permissions in browser settings.');
        } else if (err.code === err.TIMEOUT) {
          setGpsError('GPS location request timed out. Please check your signal and try again.');
        } else {
          setGpsError('Failed to acquire GPS location. You can tap directly on the map to set coordinates.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  };

  // Search Landmarks / Harbors / Towns
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);
    setShowSearchResults(true);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim()
        )}&limit=5`
      );
      if (res.ok) {
        const data: SearchCandidate[] = await res.json();
        setSearchResults(data);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (item: SearchCandidate) => {
    const newLat = Math.round(parseFloat(item.lat) * 100000) / 100000;
    const newLng = Math.round(parseFloat(item.lon) * 100000) / 100000;

    onChange({
      lat: newLat,
      lng: newLng,
      suggestedName: item.name || searchQuery,
    });
    fetchReverseAddress(newLat, newLng);

    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([newLat, newLng]);
      mapInstanceRef.current.flyTo([newLat, newLng], 15, { animate: true, duration: 1 });
    }

    setShowSearchResults(false);
  };

  return (
    <div className="space-y-3 bg-slate-950/80 p-3.5 sm:p-4 rounded-2xl border border-slate-800">
      
      {/* Header and Quick Location Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Spot Coordinates (Map / GPS)</span>
            <span className="text-[10px] text-slate-400">Tap map to pin point, drag pin, or use GPS location</span>
          </div>
        </div>

        {/* Action Buttons: GPS & Layer Toggle */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleGetGPS}
            disabled={isLocating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-950 transition-all disabled:opacity-50"
            title="Locate device GPS position and move pin"
          >
            {isLocating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5" />
            )}
            <span>Current GPS</span>
          </button>

          <button
            type="button"
            onClick={() => setMapStyle(mapStyle === 'standard' ? 'satellite' : 'standard')}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-xl text-xs font-medium transition-colors"
            title="Switch Map / Satellite View"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>{mapStyle === 'satellite' ? 'Map' : 'Satellite'}</span>
          </button>

          {onSwitchToFullMap && (
            <button
              type="button"
              onClick={onSwitchToFullMap}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-700/80 rounded-xl text-xs font-medium transition-colors"
              title="Pin on Fullscreen Map"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Full Map</span>
            </button>
          )}
        </div>
      </div>

      {/* GPS Error alert if any */}
      {gpsError && (
        <div className="p-2.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-[11px] leading-relaxed">
            {gpsError}
          </div>
        </div>
      )}

      {/* Place / Landmark Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search harbor, beach, point, or town name..."
              className="w-full bg-slate-900 border border-slate-700/80 focus:border-sky-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shrink-0"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && (
          <div className="absolute left-0 right-0 top-full mt-1 z-[1100] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
            {isSearching ? (
              <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                <span>Searching places...</span>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                No matching locations found. Try a different query.
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full p-2.5 text-left hover:bg-slate-800/80 transition-colors flex items-start gap-2 text-xs"
                  >
                    <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-white truncate">{item.name || item.display_name.split(',')[0]}</div>
                      <div className="text-[10px] text-slate-400 truncate">{item.display_name}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </form>

      {/* Interactive Leaflet Mini-Map Container */}
      <div className="relative rounded-xl overflow-hidden border border-slate-700/80 shadow-inner group">
        <div 
          ref={mapContainerRef} 
          className="w-full h-52 sm:h-60 z-0 bg-slate-950 cursor-crosshair" 
        />

        {/* Map Tap Guide Overlay */}
        <div className="absolute bottom-2 left-2 right-2 z-[400] pointer-events-none">
          <div className="bg-slate-950/85 backdrop-blur-sm border border-slate-800/90 rounded-lg px-2.5 py-1 text-[11px] text-slate-200 flex items-center justify-between shadow-lg">
            <span className="flex items-center gap-1.5 font-medium truncate">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shrink-0"></span>
              <span className="truncate">Tap map or drag pin to relocate</span>
            </span>
            <span className="font-mono text-[10px] text-sky-400 font-bold ml-1 shrink-0">
              {lat.toFixed(4)}, {lng.toFixed(4)}
            </span>
          </div>
        </div>
      </div>

      {/* Location Confirmation Tag */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">
            {reverseAddress ? `Pin: ${reverseAddress}` : `Coordinates: Lat ${lat.toFixed(5)}° / Lng ${lng.toFixed(5)}°`}
          </span>
        </div>

        {/* Collapsible toggle for direct numeric entry */}
        <button
          type="button"
          onClick={() => setShowManualCoords(!showManualCoords)}
          className="text-[11px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-0.5 shrink-0 ml-2"
        >
          <span>Manual Input</span>
          {showManualCoords ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Collapsible Manual Decimal Coordinate Inputs */}
      {showManualCoords && (
        <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2 animate-in fade-in">
          <div className="text-[10px] text-slate-400">
            Enter or paste precise latitude and longitude values directly (default is set via map tap or GPS).
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">Latitude</span>
              <input
                type="number"
                step="0.00001"
                value={lat}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (Number.isFinite(val)) onChange({ lat: val, lng });
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">Longitude</span>
              <input
                type="number"
                step="0.00001"
                value={lng}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (Number.isFinite(val)) onChange({ lat, lng: val });
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
