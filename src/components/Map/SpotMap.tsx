import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { FishingSpot, CatchLog, SpotType } from '../../types/fishing';
import { useLanguage } from '../../i18n/LanguageContext';
import { 
  MapPin, Compass, Plus, Crosshair, Navigation, 
  Search, Globe, ChevronDown, X, Sparkles, AlertCircle, Check, Layers, Filter, Fish
} from 'lucide-react';
import { formatSpotName, formatBottomType, formatSpeciesName } from '../../utils/formatI18n';

// Fix Leaflet default marker icon path issue in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface SpotMapProps {
  spots: FishingSpot[];
  catches: CatchLog[];
  selectedSpotId?: string | null;
  onSelectSpot: (spot: FishingSpot) => void;
  onAddSpotAtCoords: (coords: { lat: number; lng: number }) => void;
  onAddCatchForSpot: (spot: FishingSpot) => void;
}

type MapTileStyle = 'satellite' | 'ocean' | 'carto' | 'topo';

interface TileLayerConfig {
  name: string;
  nameEn: string;
  shortName: string;
  shortNameEn: string;
  url: string;
  attribution: string;
  maxZoom: number;
  maxNativeZoom: number;
  minZoom: number;
  subdomains?: string[];
  description: string;
  descriptionEn: string;
}

export const TILE_LAYER_CONFIGS: Record<MapTileStyle, TileLayerConfig> = {
  satellite: {
    name: 'Satellite (Esri World)',
    nameEn: 'Satellite (Esri World)',
    shortName: 'Satellite',
    shortNameEn: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri World Imagery',
    maxZoom: 18,
    maxNativeZoom: 18,
    minZoom: 3,
    description: 'High-res satellite imagery revealing underwater reefs and flats worldwide',
    descriptionEn: 'High-res satellite imagery revealing underwater reefs and flats worldwide',
  },
  ocean: {
    name: 'Ocean Basemap (Esri)',
    nameEn: 'Ocean Basemap (Esri)',
    shortName: 'Esri Ocean',
    shortNameEn: 'Esri Ocean',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri Ocean Basemap & GEBCO',
    maxZoom: 16,
    maxNativeZoom: 16,
    minZoom: 2,
    description: 'Global bathymetry, marine depths, ocean contours, and coastal shelf details',
    descriptionEn: 'Global bathymetry, marine depths, ocean contours, and coastal shelf details',
  },
  carto: {
    name: 'CartoDB Voyager',
    nameEn: 'CartoDB Voyager',
    shortName: 'CartoDB',
    shortNameEn: 'CartoDB',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap, © CARTO',
    maxZoom: 19,
    maxNativeZoom: 19,
    minZoom: 3,
    subdomains: ['a', 'b', 'c', 'd'],
    description: 'Clean high-contrast navigation map highlighting waterways, roads, and docks',
    descriptionEn: 'Clean high-contrast navigation map highlighting waterways, roads, and docks',
  },
  topo: {
    name: 'Topographic (OpenTopoMap)',
    nameEn: 'Topographic (OpenTopoMap)',
    shortName: 'Topo',
    shortNameEn: 'Topo',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap contributors',
    maxZoom: 17,
    maxNativeZoom: 17,
    minZoom: 3,
    subdomains: ['a', 'b', 'c'],
    description: 'Topographic elevation contours and inland lake/river relief worldwide',
    descriptionEn: 'Topographic elevation contours and inland lake/river relief worldwide',
  },
};

const SPOT_TYPE_COLORS: Record<SpotType, string> = {
  breakwater: '#0284c7', // Sky blue
  rocky: '#d97706',      // Amber
  surf: '#eab308',       // Sand yellow
  estuary: '#059669',    // Emerald
  lake_pond: '#10b981',  // Green
  port: '#6366f1',       // Indigo
  boat: '#06b6d4',       // Cyan
  stream: '#14b8a6',     // Teal
  unknown: '#64748b'     // Slate gray
};

// Popular global fishing regions for quick jump
export interface FishingRegion {
  name: string;
  nameEn: string;
  category: 'portugal' | 'international';
  lat: number;
  lng: number;
  zoom: number;
}

const POPULAR_FISHING_REGIONS: FishingRegion[] = [
  // Portugal
  { name: 'Peniche (Península da Papôa & Cabo Carvoeiro)', nameEn: 'Peniche & Cabo Carvoeiro', category: 'portugal', lat: 39.3750, lng: -9.3800, zoom: 12 },
  { name: 'Sagres & Costa Vicentina (Cabo de São Vicente)', nameEn: 'Sagres & Costa Vicentina', category: 'portugal', lat: 37.0150, lng: -8.9950, zoom: 12 },
  { name: 'Ria de Aveiro (Barra de São Jacinto & Costa Nova)', nameEn: 'Ria de Aveiro & São Jacinto', category: 'portugal', lat: 40.6450, lng: -8.7450, zoom: 12 },
  { name: 'Sesimbra & Cabo Espichel (Parque Natural da Arrábida)', nameEn: 'Sesimbra & Cabo Espichel', category: 'portugal', lat: 38.4450, lng: -9.1850, zoom: 12 },
  { name: 'Grande Lago de Alqueva (Monsaraz & Mourão, Alentejo)', nameEn: 'Alqueva & Monsaraz', category: 'portugal', lat: 38.3850, lng: -7.3450, zoom: 11 },
  { name: 'Foz do Douro (Porto & Matosinhos)', nameEn: 'Foz do Douro (Porto)', category: 'portugal', lat: 41.1450, lng: -8.6700, zoom: 12 },
  { name: 'Ria Formosa (Olhão, Faro & Tavira, Algarve)', nameEn: 'Ria Formosa (Algarve)', category: 'portugal', lat: 37.0050, lng: -7.8650, zoom: 12 },
  { name: 'Açores (Ilha de São Miguel & Canal do Faial)', nameEn: 'Açores (Azores)', category: 'portugal', lat: 37.7400, lng: -25.6700, zoom: 10 },
  { name: 'Madeira (Funchal & Ponta de São Lourenço)', nameEn: 'Madeira (Funchal)', category: 'portugal', lat: 32.7450, lng: -16.7150, zoom: 11 },
  // International
  { name: 'Rías Baixas (Galiza, Espanha)', nameEn: 'Rías Baixas (Galicia, Spain)', category: 'international', lat: 42.4500, lng: -8.8500, zoom: 11 },
  { name: 'Bretanha (Finistère & Raz de Sein, França)', nameEn: 'Brittany (France)', category: 'international', lat: 48.0350, lng: -4.7350, zoom: 11 },
  { name: 'Florida Keys (Islamorada, EUA)', nameEn: 'Florida Keys (USA)', category: 'international', lat: 24.9242, lng: -80.6278, zoom: 12 },
];

export const SpotMap: React.FC<SpotMapProps> = ({
  spots,
  catches,
  selectedSpotId,
  onSelectSpot,
  onAddSpotAtCoords,
  onAddCatchForSpot,
}) => {
  const { t, isEn, lang } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userLocationLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const tempPinMarkerRef = useRef<L.Marker | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const initialCenteredRef = useRef<boolean>(false);

  const [activeTileStyle, setActiveTileStyle] = useState<MapTileStyle>('satellite');
  const [currentZoom, setCurrentZoom] = useState<number>(13);
  const [selectedFilterType, setSelectedFilterType] = useState<string>('all');
  const [tempCoords, setTempCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Geolocation States
  const [userCoords, setUserCoords] = useState<{ 
    lat: number; 
    lng: number; 
    accuracy: number;
    source?: 'gps' | 'network' | 'ip';
    label?: string;
  } | null>(null);

  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [locationStatusMessage, setLocationStatusMessage] = useState<string | null>(null);
  
  // Search & Quick Jump Overlay
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState<boolean>(false);
  const [activePreviewSpot, setActivePreviewSpot] = useState<FishingSpot | null>(null);

  // Update or create the User Location pulsating blue marker
  const updateUserLocationMarker = useCallback((
    lat: number, 
    lng: number, 
    accuracy: number, 
    shouldCenter = false,
    source: 'gps' | 'network' | 'ip' = 'gps',
    label?: string
  ) => {
    if (!mapInstanceRef.current || !userLocationLayerRef.current) return;
    const map = mapInstanceRef.current;
    const layer = userLocationLayerRef.current;

    setUserCoords({ lat, lng, accuracy, source, label });

    const isIP = source === 'ip';
    const markerColor = isIP ? '#06b6d4' : '#0284c7'; // cyan for IP, vibrant sky blue for GPS
    const pulseColor = isIP ? 'rgba(6, 182, 212, 0.45)' : 'rgba(56, 189, 248, 0.45)';

    // Custom Glowing Blue GPS Beacon Icon
    const userLocationIcon = L.divIcon({
      className: 'custom-user-location-marker',
      html: `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
          <!-- Pulsing Outer Ring -->
          <div class="user-location-pulse" style="
            position: absolute;
            width: 34px;
            height: 34px;
            border-radius: 9999px;
            background-color: ${pulseColor};
          "></div>
          <!-- Inner Core Beacon -->
          <div style="
            position: relative;
            width: 16px;
            height: 16px;
            border-radius: 9999px;
            background-color: ${markerColor};
            border: 3px solid #ffffff;
            box-shadow: 0 0 12px ${markerColor}, 0 2px 6px rgba(0,0,0,0.5);
            z-index: 10;
          "></div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([lat, lng]);
      userMarkerRef.current.setIcon(userLocationIcon);
    } else {
      const marker = L.marker([lat, lng], { 
        icon: userLocationIcon,
        zIndexOffset: 1000 
      }).addTo(layer);

      // Popup on clicking user's location
      const popupDiv = document.createElement('div');
      popupDiv.className = 'p-3 text-slate-800 text-xs font-sans max-w-[240px]';
      const locTitle = isIP ? t.mapEstimatedLocation : t.mapYourLocation;
      const methodLabel = isIP 
        ? 'IP Network Estimation' 
        : 'Device GPS / Wi-Fi';
      const latLonLabel = `Lat ${Math.abs(lat).toFixed(5)}° ${lat >= 0 ? 'N' : 'S'}<br/>Lng ${Math.abs(lng).toFixed(5)}° ${lng >= 0 ? 'E' : 'W'}`;
      const accuracyLabel = `±${Math.round(accuracy)}m`;

      popupDiv.innerHTML = `
        <div class="font-bold text-sm text-sky-700 flex items-center gap-1.5 mb-1">
          <span class="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping"></span>
          <span>📍 ${locTitle}</span>
        </div>
        ${label ? `<div class="font-medium text-slate-700 text-xs mb-1">${escapeHtml(label)}</div>` : ''}
        <div class="font-mono text-slate-600 text-[11px] mb-1">
          ${latLonLabel}
        </div>
        <div class="text-[11px] text-slate-500 mb-2">
          ${methodLabel} (${accuracyLabel})
        </div>
        <button id="btn-pin-here" class="w-full py-1.5 px-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1">
          <span>${t.mapPinHere}</span>
        </button>
      `;

      marker.bindPopup(popupDiv);
      marker.on('popupopen', () => {
        const pinBtn = document.getElementById('btn-pin-here');
        if (pinBtn) {
          pinBtn.onclick = () => {
            onAddSpotAtCoords({ lat: Math.round(lat * 100000) / 100000, lng: Math.round(lng * 100000) / 100000 });
            marker.closePopup();
          };
        }
      });

      userMarkerRef.current = marker;
    }

    // Accuracy Circle
    const displayAccuracy = isIP ? Math.min(accuracy, 3000) : accuracy;
    if (userAccuracyCircleRef.current) {
      userAccuracyCircleRef.current.setLatLng([lat, lng]);
      userAccuracyCircleRef.current.setRadius(displayAccuracy);
    } else {
      const circle = L.circle([lat, lng], {
        radius: displayAccuracy,
        color: markerColor,
        weight: 1.5,
        opacity: 0.6,
        fillColor: markerColor,
        fillOpacity: 0.1,
      }).addTo(layer);
      userAccuracyCircleRef.current = circle;
    }

    if (shouldCenter) {
      const zoomLevel = isIP ? 13 : 16;
      map.flyTo([lat, lng], zoomLevel, { animate: true, duration: 1 });
    }
  }, [onAddSpotAtCoords]);

  // Fallback to IP-based Geolocation if browser GPS times out or fails
  const fetchIPLocationFallback = useCallback(async (centerImmediately = true) => {
    setLocationStatusMessage('GPS timed out. Finding location via IP network...');
    
    // Try multiple free IP Geolocation endpoints in sequence for high reliability
    const endpoints = [
      'https://ipapi.co/json/',
      'https://freeipapi.com/api/json',
      'https://ipwho.is/'
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (!res.ok) continue;
        const data = await res.json();
        
        const lat = parseFloat(data.latitude || data.lat);
        const lng = parseFloat(data.longitude || data.lon);
        const region = data.region || data.region_name || data.city || data.country_name || 'Estimated Location';

        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          updateUserLocationMarker(lat, lng, 3000, centerImmediately, 'ip', region);
          setLocationStatusMessage(`Estimated network location (${region}) updated`);
          setTimeout(() => setLocationStatusMessage(null), 5000);
          return true;
        }
      } catch (e) {
        // try next endpoint
      }
    }

    setLocationStatusMessage('Failed to detect location. Please use Search/Quick Jump to navigate.');
    setTimeout(() => setLocationStatusMessage(null), 6000);
    return false;
  }, [updateUserLocationMarker]);

  // Multi-tier locate handler
  // Tier 1: Fast WiFi/Network geolocation (no timeout, maxAge 5min, enableHighAccuracy: false)
  // Tier 2: If timeout or error -> Automatic IP-based Geolocation fallback
  const handleLocateMe = useCallback((centerImmediately = true) => {
    if (!navigator.geolocation) {
      fetchIPLocationFallback(centerImmediately);
      return;
    }

    setIsLocating(true);
    setLocationStatusMessage(t.mapLocatingGPS);

    // Note: enableHighAccuracy: false solves the common browser timeout on laptops/desktops
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude, accuracy } = pos.coords;
        updateUserLocationMarker(latitude, longitude, accuracy, centerImmediately, 'gps');
        setLocationStatusMessage(`Current location updated (accuracy: ±${Math.round(accuracy)}m)`);
        setTimeout(() => setLocationStatusMessage(null), 4000);
      },
      (err) => {
        console.warn('Fast geolocation failed or timed out:', err);
        // If timed out (code 3) or unavailable, immediately execute Tier 2 IP fallback
        fetchIPLocationFallback(centerImmediately).finally(() => {
          setIsLocating(false);
        });
      },
      // Extended timeout to 18000ms (18s) to allow satellite search and permission dialogs
      { enableHighAccuracy: false, timeout: 18000, maximumAge: 120000 }
    );
  }, [updateUserLocationMarker, fetchIPLocationFallback, t, isEn]);

  // Toggle Live Tracking mode
  const toggleLiveTracking = useCallback(() => {
    if (isTracking) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsTracking(false);
      setLocationStatusMessage(t.mapTrackingStop);
      setTimeout(() => setLocationStatusMessage(null), 3000);
    } else {
      if (!navigator.geolocation) {
        setLocationStatusMessage(t.mapTrackingUnavailable);
        return;
      }
      setIsTracking(true);
      setLocationStatusMessage(t.mapTrackingStart);

      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          updateUserLocationMarker(latitude, longitude, accuracy, false, 'gps');
        },
        (err) => {
          console.warn('Watch position error:', err);
          setIsTracking(false);
          setLocationStatusMessage('Tracking interrupted: ' + err.message);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 3000 }
      );
      watchIdRef.current = id;
    }
  }, [isTracking, updateUserLocationMarker, t]);

  // Place search using OpenStreetMap Nominatim (Global worldwide search without countrycodes=jp restriction)
  const handleSearchPlaces = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearchingPlaces(true);
    try {
      const q = encodeURIComponent(searchQuery.trim());
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=6`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  const handleSelectSearchResult = (latStr: string, lonStr: string, name: string) => {
    const lat = parseFloat(latStr);
    const lng = parseFloat(lonStr);
    if (!isNaN(lat) && !isNaN(lng) && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 14, { animate: true, duration: 1.2 });
      setIsSearchOpen(false);
      setLocationStatusMessage(`Moved to "${name}"`);
      setTimeout(() => setLocationStatusMessage(null), 3000);
    }
  };

  const handleSelectQuickRegion = (region: FishingRegion) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([region.lat, region.lng], region.zoom, { animate: true, duration: 1.2 });
      setIsSearchOpen(false);
      const displayName = region.nameEn || region.name;
      setLocationStatusMessage(`Moved to "${displayName}"`);
      setTimeout(() => setLocationStatusMessage(null), 3000);
    }
  };

  // Clean up watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const defaultCenter: [number, number] = spots.length > 0 
      ? [spots[0].lat, spots[0].lng] 
      : [39.3750, -9.3800]; // Peniche / Costa de Prata default

    const initialConfig = TILE_LAYER_CONFIGS[activeTileStyle] || TILE_LAYER_CONFIGS.satellite;

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 13,
      minZoom: initialConfig.minZoom,
      maxZoom: initialConfig.maxZoom,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const initialTile = L.tileLayer(initialConfig.url, {
      attribution: initialConfig.attribution,
      maxZoom: initialConfig.maxZoom,
      maxNativeZoom: initialConfig.maxNativeZoom,
      minZoom: initialConfig.minZoom,
      subdomains: initialConfig.subdomains || 'abc',
    }).addTo(map);
    tileLayerRef.current = initialTile;

    // Track zoom level changes and update state
    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    const userLayer = L.layerGroup().addTo(map);
    userLocationLayerRef.current = userLayer;

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    map.on('click', (e: L.LeafletMouseEvent) => {
      setActivePreviewSpot(null);
      const lat = Math.round(e.latlng.lat * 100000) / 100000;
      const lng = Math.round(e.latlng.lng * 100000) / 100000;
      setTempCoords({ lat, lng });

      if (tempPinMarkerRef.current) {
        tempPinMarkerRef.current.setLatLng([lat, lng]);
      } else {
        const customTempIcon = L.divIcon({
          className: 'custom-temp-pin',
          html: `
            <div style="
              width: 36px; height: 36px; 
              display: flex; align-items: center; justify-content: center;
              background-color: #ef4444; color: white; border-radius: 9999px;
              box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5);
              border: 2px solid #ffffff;
            ">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a8 8 0 0 0-8 8c0 5.4 7.05 11.5 7.35 11.76a1 1 0 0 0 1.3 0C12.95 21.5 20 15.4 20 10a8 8 0 0 0-8-8z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
        });

        tempPinMarkerRef.current = L.marker([lat, lng], { icon: customTempIcon }).addTo(map);
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // When spots load for the first time, center on the first spot if no specific spot was selected.
  // If no spots exist yet, auto-trigger GPS locate so international users immediately see their local waters!
  useEffect(() => {
    if (initialCenteredRef.current || !mapInstanceRef.current || selectedSpotId) return;

    if (spots.length > 0) {
      initialCenteredRef.current = true;
      mapInstanceRef.current.setView([spots[0].lat, spots[0].lng], 13);
    } else {
      initialCenteredRef.current = true;
      handleLocateMe(true);
    }
  }, [spots, selectedSpotId, handleLocateMe]);

  // Update Tile Layer when tile style changes with strict zoom limits
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const config = TILE_LAYER_CONFIGS[activeTileStyle] || TILE_LAYER_CONFIGS.satellite;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    // Set maximum and minimum zoom limits on the map to stop the zoom from disappearing
    map.setMaxZoom(config.maxZoom);
    map.setMinZoom(config.minZoom);

    // If current zoom exceeds this layer's maxZoom, clamp it down safely
    if (map.getZoom() > config.maxZoom) {
      map.setZoom(config.maxZoom);
    }

    const newLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
      maxNativeZoom: config.maxNativeZoom,
      minZoom: config.minZoom,
      subdomains: config.subdomains || 'abc',
    }).addTo(map);

    tileLayerRef.current = newLayer;
    setCurrentZoom(map.getZoom());
  }, [activeTileStyle]);

  // Update Spot Markers on map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    const filteredSpots = spots.filter((spot) => {
      if (selectedFilterType === 'all') return true;
      if (selectedFilterType === 'wishlist_only') return !!spot.wishlistSpot;
      if (selectedFilterType === 'active_only') return !spot.avoidSpot && !spot.wishlistSpot;
      if (selectedFilterType === 'avoid_only') return !!spot.avoidSpot;
      if (selectedFilterType === 'favorite') return spot.favorite;
      return spot.spotType === selectedFilterType;
    });

    filteredSpots.forEach((spot) => {
      const spotCatches = catches.filter((c) => c.spotId === spot.id);
      const catchCount = spotCatches.reduce((acc, c) => acc + (c.isNoCatch ? 0 : (c.quantity || 1)), 0);
      const isSelected = selectedSpotId === spot.id;
      const spotColor = SPOT_TYPE_COLORS[spot.spotType] || '#0284c7';
      const isAvoid = !!spot.avoidSpot;
      const isWishlist = !isAvoid && !!spot.wishlistSpot;

      const markerBg = isAvoid ? '#1e293b' : isWishlist ? '#7c3aed' : spotColor;
      const markerBorder = isAvoid ? '2.5px solid #ef4444' : isWishlist ? '2.5px solid #e9d5ff' : '2.5px solid #ffffff';
      const markerColor = isAvoid ? '#ef4444' : '#ffffff';
      const markerShadow = isAvoid 
        ? '0 4px 14px rgba(239, 68, 68, 0.5)' 
        : isWishlist 
        ? '0 4px 14px rgba(124, 58, 237, 0.6)' 
        : '0 4px 12px rgba(0, 0, 0, 0.4)';
      const markerOutline = isSelected 
        ? (isAvoid ? 'outline: 3px solid #ef4444;' : isWishlist ? 'outline: 3px solid #a855f7;' : 'outline: 3px solid #38bdf8;') 
        : '';

      const iconHtml = `
        <div style="position: relative; cursor: pointer;">
          <div style="
            width: ${isSelected ? '44px' : '36px'};
            height: ${isSelected ? '44px' : '36px'};
            background: ${markerBg};
            border: ${markerBorder};
            border-radius: 9999px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${markerColor};
            box-shadow: ${markerShadow};
            transform: translate(-50%, -50%);
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            ${markerOutline}
          ">
            ${
              isAvoid
                ? `<svg width="${isSelected ? '22' : '18'}" height="${isSelected ? '22' : '18'}" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                  </svg>`
                : isWishlist
                ? `<svg width="${isSelected ? '22' : '18'}" height="${isSelected ? '22' : '18'}" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="6"></circle>
                    <circle cx="12" cy="12" r="2"></circle>
                  </svg>`
                : `<svg width="${isSelected ? '22' : '18'}" height="${isSelected ? '22' : '18'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2a8 8 0 0 0-8 8c0 5.4 7.05 11.5 7.35 11.76a1 1 0 0 0 1.3 0C12.95 21.5 20 15.4 20 10a8 8 0 0 0-8-8z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>`
            }
          </div>
          ${
            isAvoid
              ? `<div style="
                  position: absolute;
                  top: -24px;
                  left: -6px;
                  background: #7f1d1d;
                  color: #fee2e2;
                  font-size: 10px;
                  font-weight: 800;
                  padding: 1px 6px;
                  border-radius: 9999px;
                  border: 1px solid #ef4444;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.5);
                  white-space: nowrap;
                ">
                  ⛔ Avoid
                </div>`
              : isWishlist
              ? `<div style="
                  position: absolute;
                  top: -24px;
                  left: -12px;
                  background: #581c87;
                  color: #f3e8ff;
                  font-size: 10px;
                  font-weight: 800;
                  padding: 1px 6px;
                  border-radius: 9999px;
                  border: 1px solid #c084fc;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                  white-space: nowrap;
                ">
                  ${spot.planDate ? `📅 ${escapeHtml(spot.planDate.slice(5))}` : '🎯 Wishlist'}
                </div>`
              : catchCount > 0
              ? `<div style="
                  position: absolute;
                  top: -24px;
                  left: 6px;
                  background: #0f172a;
                  color: #38bdf8;
                  font-size: 11px;
                  font-weight: 700;
                  font-family: ui-monospace, monospace;
                  padding: 1px 6px;
                  border-radius: 9999px;
                  border: 1px solid rgba(56, 189, 248, 0.4);
                  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                  white-space: nowrap;
                ">
                  ${catchCount} 🐟
                </div>`
              : ''
          }
          ${
            spot.favorite && !isAvoid
              ? `<div style="
                  position: absolute;
                  bottom: -18px;
                  left: 6px;
                  background: #eab308;
                  color: #ffffff;
                  width: 16px;
                  height: 16px;
                  border-radius: 9999px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 10px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                ">★</div>`
              : ''
          }
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-spot-marker',
        html: iconHtml,
        iconSize: [0, 0],
      });

      const marker = L.marker([spot.lat, spot.lng], { icon: customIcon });

      marker.on('click', () => {
        setTempCoords(null);
        setActivePreviewSpot(spot);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo([spot.lat, spot.lng], { animate: true, duration: 0.4 });
          // Shift camera slightly so pin stays prominent above the bottom floating card
          setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.panBy([0, 60], { animate: true, duration: 0.3 });
            }
          }, 150);
        }
      });

      marker.addTo(markersLayer);
    });
  }, [spots, catches, selectedFilterType, selectedSpotId]);

  // Center on selected spot if changed
  useEffect(() => {
    if (!selectedSpotId || !mapInstanceRef.current) return;
    const target = spots.find((s) => s.id === selectedSpotId);
    if (target) {
      setActivePreviewSpot(target);
      mapInstanceRef.current.flyTo([target.lat, target.lng], 16, {
        animate: true,
        duration: 1.2,
      });
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panBy([0, 60], { animate: true, duration: 0.3 });
        }
      }, 700);
    }
  }, [selectedSpotId, spots]);

  const handleConfirmPinAdd = () => {
    if (tempCoords) {
      onAddSpotAtCoords(tempCoords);
      setTempCoords(null);
      if (tempPinMarkerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(tempPinMarkerRef.current);
        tempPinMarkerRef.current = null;
      }
    }
  };

  const handleCancelPinDrop = () => {
    setTempCoords(null);
    if (tempPinMarkerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(tempPinMarkerRef.current);
      tempPinMarkerRef.current = null;
    }
  };

  const handleAddSpotAtUserLocation = () => {
    if (userCoords) {
      onAddSpotAtCoords({
        lat: Math.round(userCoords.lat * 100000) / 100000,
        lng: Math.round(userCoords.lng * 100000) / 100000,
      });
    } else {
      handleLocateMe(true);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-slate-950">
      
      {/* Status Toast / Notification Banner */}
      {locationStatusMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1100] max-w-md w-11/12 bg-slate-900/95 backdrop-blur-md text-white border border-sky-500/60 px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
          <Compass className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="flex-1">{locationStatusMessage}</span>
          <button 
            onClick={() => setLocationStatusMessage(null)}
            className="text-slate-400 hover:text-white text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Map Controls Overlay: Compact, Floating, Single-line fitted perfectly without scrolling */}
      <div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-4 sm:right-4 z-[1000] pointer-events-none">
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 pointer-events-auto py-0.5 max-w-full">
          
          {/* 1. Map Tile Switcher Dropdown */}
          <div className="relative shrink-0">
            <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-sky-400">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <select
              value={activeTileStyle}
              onChange={(e) => setActiveTileStyle(e.target.value as MapTileStyle)}
              className="bg-slate-900/95 hover:bg-slate-800 border border-slate-700/80 text-white text-[11px] sm:text-xs font-semibold rounded-lg sm:rounded-xl pl-6 sm:pl-7 pr-5 sm:pr-6 py-1 sm:py-1.5 focus:outline-none focus:border-sky-500 shadow-xl backdrop-blur-md cursor-pointer transition-colors appearance-none whitespace-nowrap max-w-[78px] min-[380px]:max-w-[88px] sm:max-w-none"
              title={isEn ? 'Switch map layer (Satellite, Esri Ocean, CartoDB, Topo)' : 'Switch map layer'}
            >
              <option value="satellite" className="bg-slate-900 text-white font-medium">🛰️ Satellite</option>
              <option value="ocean" className="bg-slate-900 text-white font-medium">🌊 Esri Ocean</option>
              <option value="carto" className="bg-slate-900 text-white font-medium">🗺️ CartoDB</option>
              <option value="topo" className="bg-slate-900 text-white font-medium">⛰️ Topo</option>
            </select>
            <div className="absolute inset-y-0 right-1.5 flex items-center pointer-events-none text-slate-400">
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>

          {/* 2. Spot Filter Dropdown */}
          <div className="relative shrink-0">
            <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-emerald-400">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <select
              value={selectedFilterType}
              onChange={(e) => setSelectedFilterType(e.target.value)}
              className="bg-slate-900/95 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-[11px] sm:text-xs font-semibold rounded-lg sm:rounded-xl pl-6 sm:pl-7 pr-5 sm:pr-6 py-1 sm:py-1.5 focus:outline-none focus:border-sky-500 shadow-xl backdrop-blur-md cursor-pointer transition-colors appearance-none whitespace-nowrap max-w-[76px] min-[360px]:max-w-[88px] min-[420px]:max-w-[120px] sm:max-w-[160px] truncate"
              title="Filter fishing spots"
            >
              <option value="all" className="bg-slate-900 text-white font-medium">{`All (${spots.length})`}</option>
              <option value="wishlist_only" className="bg-slate-900 text-white font-medium">{`🎯 Wish (${spots.filter((s) => s.wishlistSpot).length})`}</option>
              <option value="active_only" className="bg-slate-900 text-white font-medium">{`Recorded (${spots.filter((s) => !s.avoidSpot && !s.wishlistSpot).length})`}</option>
              <option value="avoid_only" className="bg-slate-900 text-white font-medium">{`⛔ Avoid (${spots.filter((s) => s.avoidSpot).length})`}</option>
              <option value="favorite" className="bg-slate-900 text-white font-medium">{`★ Fav (${spots.filter((s) => s.favorite).length})`}</option>
              <option value="breakwater" className="bg-slate-900 text-white font-medium">Breakwater</option>
              <option value="rocky" className="bg-slate-900 text-white font-medium">Rocky Shore</option>
              <option value="surf" className="bg-slate-900 text-white font-medium">Surf / Beach</option>
              <option value="estuary" className="bg-slate-900 text-white font-medium">Estuary / River</option>
              <option value="lake_pond" className="bg-slate-900 text-white font-medium">Lake / Pond</option>
              <option value="port" className="bg-slate-900 text-white font-medium">Port / Harbor</option>
              <option value="boat" className="bg-slate-900 text-white font-medium">Boat / Offshore</option>
              <option value="stream" className="bg-slate-900 text-white font-medium">Stream / Creek</option>
              <option value="unknown" className="bg-slate-900 text-white font-medium">Unknown</option>
            </select>
            <div className="absolute inset-y-0 right-1.5 flex items-center pointer-events-none text-slate-400">
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>

          {/* 3. Area Search / Region Jump Toggle */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 bg-slate-900/95 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-lg sm:rounded-xl backdrop-blur-md shadow-xl text-[11px] sm:text-xs font-semibold transition-colors shrink-0"
            title="Search places or jump to famous fishing areas"
          >
            <Search className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="hidden min-[380px]:inline whitespace-nowrap">Search</span>
          </button>

          {/* 4. Main Locate Me Button */}
          <button
            onClick={() => handleLocateMe(true)}
            disabled={isLocating}
            className={`flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl backdrop-blur-md shadow-xl text-[11px] sm:text-xs font-semibold border transition-all shrink-0 ${
              userCoords
                ? 'bg-sky-600/95 hover:bg-sky-500 text-white border-sky-400 shadow-sky-900/50'
                : 'bg-slate-900/95 hover:bg-slate-800 text-sky-400 border-slate-700/80'
            }`}
            title="Get current GPS/network location with glowing marker"
          >
            <Navigation className={`w-3.5 h-3.5 shrink-0 ${isLocating ? 'animate-spin text-white' : userCoords ? 'text-white' : 'text-sky-400'}`} />
            <span className="whitespace-nowrap">
              {isLocating ? (
                <span className="text-[10px] sm:text-xs">Locating...</span>
              ) : userCoords ? (
                <>
                  <span className="inline sm:hidden">GPS</span>
                  <span className="hidden sm:inline">
                    {userCoords.source === 'ip' ? 'Est. Location' : 'Current Loc'}
                  </span>
                </>
              ) : (
                <>
                  <span className="inline sm:hidden">Loc</span>
                  <span className="hidden sm:inline">Get Location</span>
                </>
              )}
            </span>
          </button>

          {/* 5. Real-time Tracking Toggle */}
          <button
            onClick={toggleLiveTracking}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl backdrop-blur-md text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
              isTracking
                ? 'bg-emerald-600 text-white border-emerald-400 animate-pulse'
                : 'bg-slate-900/95 hover:bg-slate-800 text-slate-300 border-slate-700/80'
            }`}
            title="Track position in real time as you move"
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${isTracking ? 'bg-white' : 'bg-slate-500'}`}></span>
            <span className="whitespace-nowrap">{isTracking ? 'Tracking' : 'Auto Track'}</span>
          </button>

          {/* 6. Quick Add at User Location */}
          {userCoords && (
            <button
              onClick={handleAddSpotAtUserLocation}
              className="flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold shadow-lg shadow-emerald-950 transition-colors border border-emerald-400 shrink-0"
              title="Add new fishing spot at current GPS coordinates"
            >
              <Plus className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
              <span className="hidden sm:inline whitespace-nowrap">Pin Spot</span>
              <span className="inline sm:hidden whitespace-nowrap">Pin</span>
            </button>
          )}

        </div>
      </div>

      {/* User Location Info Badge if located */}
      {userCoords && (
        <div className="absolute top-16 right-4 z-[990] hidden lg:flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
          <span className="font-mono">
            {userCoords.source === 'ip' ? '🌐 Estimated Area' : '📍 My Location'}: {userCoords.label ? `${userCoords.label} ` : ''}
            {userCoords.lat.toFixed(4)}°, {userCoords.lng.toFixed(4)}°
          </span>
          <button
            onClick={() => handleLocateMe(true)}
            className="text-sky-400 hover:text-sky-300 ml-1 text-xs font-medium"
          >
            Center
          </button>
        </div>
      )}

      {/* Area Search / Region Selector Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-white text-base">
                  Search Spots & Quick Jump
                </h3>
              </div>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto">
              
              {/* Search Form (Worldwide) */}
              <form onSubmit={handleSearchPlaces} className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Search global places, cities, beaches, harbors, or lakes
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g., Key West, San Diego, Lake Tahoe, Sydney..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearchingPlaces}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors shadow-md"
                  >
                    {isSearchingPlaces ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </form>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-1.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 block px-2 py-0.5">
                    Search Results:
                  </span>
                  {searchResults.map((res, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectSearchResult(res.lat, res.lon, res.display_name)}
                      className="w-full text-left p-2.5 hover:bg-slate-800/80 rounded-lg text-xs text-slate-200 transition-colors flex items-center justify-between group"
                    >
                      <span className="truncate pr-2">{res.display_name}</span>
                      <Navigation className="w-3.5 h-3.5 text-sky-400 opacity-0 group-hover:opacity-100 shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Quick Jump Popular Regions (Categorized Global & US) */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-sky-300 block mb-1.5">
                    🇵🇹 Pesqueiros Notáveis em Portugal
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                    {POPULAR_FISHING_REGIONS.filter((r) => r.category === 'portugal').map((region) => (
                      <button
                        key={region.name}
                        onClick={() => handleSelectQuickRegion(region)}
                        className="p-2.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-800/80 hover:border-sky-500/50 rounded-xl text-xs text-left transition-colors flex flex-col justify-between group"
                      >
                        <span className="font-medium text-white group-hover:text-sky-300 truncate block">
                          {region.nameEn || region.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {region.lat.toFixed(2)}°, {region.lng.toFixed(2)}°
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-emerald-300 block mb-1.5">
                    🌍 Águas Internacionais
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                    {POPULAR_FISHING_REGIONS.filter((r) => r.category === 'international').map((region) => (
                      <button
                        key={region.name}
                        onClick={() => handleSelectQuickRegion(region)}
                        className="p-2.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-800/80 hover:border-emerald-500/50 rounded-xl text-xs text-left transition-colors flex flex-col justify-between group"
                      >
                        <span className="font-medium text-white group-hover:text-emerald-300 truncate block">
                          {region.nameEn || region.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {region.lat.toFixed(2)}°, {region.lng.toFixed(2)}°
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Temp Pin Drop Banner if user clicked on map */}
      {tempCoords && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-11/12 max-w-sm sm:max-w-md bg-slate-900/95 backdrop-blur-md border border-sky-500/50 text-white p-3.5 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-sky-400 font-bold whitespace-nowrap">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>Selected Pin Coordinates</span>
              </div>
              <div className="font-mono text-xs text-slate-300 whitespace-nowrap">
                Lat {Math.abs(tempCoords.lat).toFixed(5)}° {tempCoords.lat >= 0 ? 'N' : 'S'}
              </div>
              <div className="font-mono text-xs text-slate-300 whitespace-nowrap">
                Lng {Math.abs(tempCoords.lng).toFixed(5)}° {tempCoords.lng >= 0 ? 'E' : 'W'}
              </div>
            </div>

            {/* Vertical Stack: '＋ Save Spot' and 'Cancel' */}
            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleConfirmPinAdd}
                className="px-3.5 py-1.5 text-xs font-bold bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white rounded-xl shadow-lg border-2 border-amber-300 hover:border-amber-200 ring-2 ring-amber-400/50 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
                <span>Save Spot Here</span>
              </button>
              <button
                type="button"
                onClick={handleCancelPinDrop}
                className="px-3 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 rounded-xl shadow-sm transition-all whitespace-nowrap shrink-0 text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instruction Tip */}
      <div className="absolute bottom-4 left-4 z-[990] hidden md:flex items-center gap-3 text-[11px] text-slate-400 bg-slate-950/80 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-slate-800 pointer-events-auto">
        <div className="flex items-center gap-1.5">
          <Crosshair className="w-3.5 h-3.5 text-sky-400" />
          <span>Click anywhere on map to drop a pin</span>
        </div>
        <span className="text-slate-600">|</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
          <span>Use "Get Location" or "Search" to navigate to your fishing waters</span>
        </div>
      </div>

      {/* Zoom Level Indicator & Max-zoom Safety Stop Toast */}
      {currentZoom >= (TILE_LAYER_CONFIGS[activeTileStyle]?.maxZoom || 18) && (
        <div className="absolute bottom-20 right-4 z-[990] bg-slate-900/95 backdrop-blur-md border border-sky-400/80 text-sky-200 px-3 py-1.5 rounded-xl shadow-xl text-[11px] font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-sky-400"></span>
          <span>
            {`Zoom stopped at max Lv.${TILE_LAYER_CONFIGS[activeTileStyle]?.maxZoom} to prevent blank tiles`}
          </span>
        </div>
      )}

      <div className="absolute bottom-4 right-16 z-[990] bg-slate-950/85 backdrop-blur-sm border border-slate-800 text-slate-300 px-2.5 py-1 rounded-lg text-[10px] font-mono pointer-events-none hidden sm:flex items-center gap-1 shadow-md">
        <span>Zoom: Lv.{currentZoom} / Max {TILE_LAYER_CONFIGS[activeTileStyle]?.maxZoom}</span>
      </div>

      {/* Floating Bottom Card: Active Spot Preview */}
      {activePreviewSpot && (
        <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-md z-[1050] animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-auto">
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-4 text-white space-y-3">
            
            {/* Header: Title, Badges, and Close Button */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-sky-300 border border-slate-700">
                    {getSpotTypeLabel(activePreviewSpot.spotType, isEn)}
                  </span>
                  {activePreviewSpot.rating > 0 && (
                    <span className="text-[11px] font-bold text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40">
                      {'★'.repeat(Math.min(5, Math.max(1, Math.round(activePreviewSpot.rating))))}
                    </span>
                  )}
                  {activePreviewSpot.favorite && (
                    <span className="text-[11px] font-bold text-amber-400">
                      ★ Favorite
                    </span>
                  )}
                  {activePreviewSpot.wishlistSpot && (
                    <span className="text-[11px] font-semibold text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/60">
                      🎯 Wishlist
                    </span>
                  )}
                  {activePreviewSpot.avoidSpot && (
                    <span className="text-[11px] font-semibold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/60">
                      ⛔ Avoid
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-base text-white leading-snug truncate" title={formatSpotName(activePreviewSpot.name)}>
                  {formatSpotName(activePreviewSpot.name)}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setActivePreviewSpot(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors shrink-0 -mt-1 -mr-1"
                aria-label="Close spot preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Catches Count & Depth & Bottom Type */}
            <div className="flex items-center gap-2.5 flex-wrap text-xs text-slate-300">
              <div className="flex items-center gap-1 font-mono text-cyan-300 font-medium">
                <Fish className="w-3.5 h-3.5" />
                <span>
                  {catches.filter((c) => c.spotId === activePreviewSpot.id).length} catches
                </span>
              </div>
              {activePreviewSpot.waterDepth && (
                <div className="text-slate-400 text-[11px]">
                  • Depth: {activePreviewSpot.waterDepth}
                </div>
              )}
              {activePreviewSpot.bottomType && activePreviewSpot.bottomType.length > 0 && (
                <div className="text-slate-400 text-[11px] truncate">
                  • {activePreviewSpot.bottomType.map(formatBottomType).join(', ')}
                </div>
              )}
            </div>

            {/* Description / Notes snippet */}
            {activePreviewSpot.description && (
              <p className="text-xs text-slate-300 line-clamp-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 leading-relaxed">
                {activePreviewSpot.description}
              </p>
            )}

            {/* Targets */}
            {activePreviewSpot.targetSpecies.length > 0 && (
              <div className="text-xs text-slate-400 flex items-center gap-1.5 overflow-hidden">
                <span className="text-slate-500 text-[11px] shrink-0">Targets:</span>
                <span className="text-slate-300 truncate font-medium">
                  {activePreviewSpot.targetSpecies.map(formatSpeciesName).join(' · ')}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  onSelectSpot(activePreviewSpot);
                }}
                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold text-center transition-colors border border-slate-700"
              >
                View Details
              </button>
              <button
                type="button"
                onClick={() => {
                  onAddCatchForSpot(activePreviewSpot);
                }}
                className="w-full py-2 px-3 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold text-center transition-colors shadow-md shadow-sky-950 flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Log Catch</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Map DOM Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
};

function getSpotTypeLabel(spotType: SpotType, _isEn: boolean): string {
  switch (spotType) {
    case 'breakwater': return 'Breakwater / Pier';
    case 'rocky': return 'Rocky Shore / Reef';
    case 'surf': return 'Surf / Beach';
    case 'estuary': return 'Estuary / River';
    case 'lake_pond': return 'Lake / Pond';
    case 'port': return 'Port / Harbor';
    case 'boat': return 'Boat / Offshore';
    case 'stream': return 'Stream / Creek';
    default: return 'Other / Unknown';
  }
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
