import React, { useState, useEffect } from 'react';
import { FishingSpot, WeatherCondition } from '../../types/fishing';
import { useLanguage } from '../../i18n/LanguageContext';
import { 
  Compass, 
  Wind, 
  Navigation, 
  MapPin, 
  X, 
  RotateCcw, 
  Sparkles, 
  Gauge, 
  Thermometer, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface FishingCompassModalProps {
  spotName?: string;
  initialLat?: number;
  initialLng?: number;
  windDirection?: string;
  windSpeedMs?: number;
  spots?: FishingSpot[];
  onClose: () => void;
}

const DIRECTION_DEGREES: Record<string, number> = {
  'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
  'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
  'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
  'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5,
};

const WIND_DIRECTIONS_16 = [
  'N', 'NNE', 'NE', 'ENE',
  'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW',
  'W', 'WNW', 'NW', 'NNW'
];

export const FishingCompassModal: React.FC<FishingCompassModalProps> = ({
  spotName: propSpotName,
  initialLat,
  initialLng,
  windDirection: propWindDir,
  windSpeedMs: propWindSpeed,
  spots = [],
  onClose,
}) => {
  const { formatWind, formatTemp } = useLanguage();
  // Mode: current GPS vs registered spot
  const defaultMode: 'gps' | 'spot' = (initialLat !== undefined && initialLng !== undefined) ? 'spot' : 'gps';
  const [locationMode, setLocationMode] = useState<'gps' | 'spot'>(defaultMode);

  // Selected spot if in spot mode
  const [selectedSpotId, setSelectedSpotId] = useState<string>(() => {
    if (initialLat !== undefined && initialLng !== undefined) {
      const match = spots.find(s => s.lat === initialLat && s.lng === initialLng);
      return match ? match.id : (spots[0]?.id || '');
    }
    return spots[0]?.id || '';
  });

  // Location details
  const [locationTitle, setLocationTitle] = useState<string>(() => {
    if (defaultMode === 'spot') return propSpotName || 'Selected Spot';
    return 'Current Location (Acquiring GPS...)';
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(() => {
    if (initialLat !== undefined && initialLng !== undefined) {
      return { lat: initialLat, lng: initialLng };
    }
    return null;
  });
  const [locatingStatus, setLocatingStatus] = useState<'idle' | 'locating' | 'success' | 'error'>('idle');
  const [, setLocationAccuracy] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Weather & Wind
  const [windDir, setWindDir] = useState<string>(propWindDir || 'SW');
  const [windSpeed, setWindSpeed] = useState<number>(propWindSpeed !== undefined ? propWindSpeed : 3.0);
  const [temperature, setTemperature] = useState<number | undefined>(undefined);
  const [pressureHpa, setPressureHpa] = useState<number | undefined>(undefined);
  const [, setWeatherCondition] = useState<WeatherCondition | undefined>(undefined);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);
  const [, setIsLiveWeather] = useState<boolean>(false);
  const [isCustomWind, setIsCustomWind] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  // Compass Sensor & Orientation
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [, setHasCompassSensor] = useState<boolean>(false);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');

  // Convert wind direction string to angle (from where wind blows)
  const windAngleDeg = DIRECTION_DEGREES[windDir] ?? 225;

  // Request iOS permission if available
  const requestCompassPermission = async () => {
    if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          setPermissionState('granted');
          window.addEventListener('deviceorientation', handleDeviceOrientation, true);
        } else {
          setPermissionState('denied');
        }
      } catch (e) {
        console.warn('DeviceOrientation permission error', e);
        setPermissionState('denied');
      }
    } else {
      setPermissionState('granted');
      window.addEventListener('deviceorientation', handleDeviceOrientation, true);
    }
  };

  const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
    let heading: number | null = null;
    // iOS Safari webkitCompassHeading (0 = True North, clockwise)
    if ('webkitCompassHeading' in event && typeof (event as any).webkitCompassHeading === 'number') {
      heading = (event as any).webkitCompassHeading;
    } else if (event.alpha !== null) {
      heading = 360 - event.alpha;
    }

    if (heading !== null && !isNaN(heading)) {
      setDeviceHeading(Math.round(heading));
      setHasCompassSensor(true);
    }
  };

  useEffect(() => {
    if (typeof (DeviceOrientationEvent as any)?.requestPermission !== 'function') {
      window.addEventListener('deviceorientation', handleDeviceOrientation, true);
      setPermissionState('granted');
    }
    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation, true);
    };
  }, []);

  // Fetch marine weather from Open-Meteo
  const fetchWeatherForCoords = async (targetLat: number, targetLng: number) => {
    setIsLoadingWeather(true);
    setLocationError(null);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${targetLat}&longitude=${targetLng}&current=temperature_2m,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code&wind_speed_unit=ms&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
      const data = await res.json();

      if (data && data.current) {
        const current = data.current;
        const speed = Math.round((current.wind_speed_10m || 0) * 10) / 10;
        const dirDeg = current.wind_direction_10m || 0;
        const idx = Math.round(dirDeg / 22.5) % 16;
        const dirStr = WIND_DIRECTIONS_16[idx];

        setWindDir(dirStr);
        setWindSpeed(speed);
        setTemperature(Math.round((current.temperature_2m || 0) * 10) / 10);
        setPressureHpa(Math.round(current.surface_pressure || 1013));
        setIsLiveWeather(true);
        setLastRefreshedAt(new Date());

        const code = current.weather_code;
        if (code === 0) setWeatherCondition('sunny');
        else if (code >= 1 && code <= 3) setWeatherCondition('cloudy');
        else if (code >= 45 && code <= 48) setWeatherCondition('fog');
        else if (code >= 51 && code <= 67) setWeatherCondition('rain');
        else if (code >= 71 && code <= 77) setWeatherCondition('cloudy');
        else if (code >= 80 && code <= 82) setWeatherCondition('rain');
        else setWeatherCondition('cloudy');
      }
    } catch (e: any) {
      console.warn('Weather API failed, keeping current or fallback:', e);
      setLocationError('Failed to fetch real-time weather from Open-Meteo. Using offline estimate.');
    } finally {
      setIsLoadingWeather(false);
    }
  };

  // Acquire Current Location (GPS)
  const acquireCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setLocatingStatus('locating');
    setLocationError(null);
    setLocationTitle('Acquiring GPS location...');

    const onResolved = (lat: number, lng: number, title: string, accuracy?: number) => {
      setCoords({ lat, lng });
      setLocationTitle(title);
      if (accuracy !== undefined) setLocationAccuracy(accuracy);
      setLocatingStatus('success');
      fetchWeatherForCoords(lat, lng);
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy || 0);
        onResolved(lat, lng, `Current Location (GPS ±${acc}m)`, acc);
      },
      (err) => {
        console.warn('GPS location error:', err);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Location access was blocked. Please enable geolocation in browser settings.');
          fallbackToNetworkLocation(onResolved);
        } else if (err.code === err.TIMEOUT) {
          setLocationError('GPS acquisition timed out. Using network estimated location.');
          fallbackToNetworkLocation(onResolved);
        } else {
          setLocationError('Failed to acquire GPS location. Using estimated location.');
          fallbackToNetworkLocation(onResolved);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000,
      }
    );
  };

  // IP fallback if GPS blocked
  const fallbackToNetworkLocation = async (onResolved: (lat: number, lng: number, title: string) => void) => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        const lat = parseFloat(data.latitude);
        const lng = parseFloat(data.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          const city = data.city || data.region || 'Network Area';
          onResolved(lat, lng, `Location (${city})`);
          return;
        }
      }
    } catch (e) {
      console.warn('Network location fallback failed:', e);
    }

    // Default Coastal coordinates if both fail
    onResolved(24.9242, -80.6278, 'Florida Keys (Islamorada)');
  };

  useEffect(() => {
    if (locationMode === 'gps') {
      acquireCurrentLocation();
    } else {
      const sp = spots.find((s) => s.id === selectedSpotId);
      if (sp) {
        setCoords({ lat: sp.lat, lng: sp.lng });
        setLocationTitle(sp.name);
        fetchWeatherForCoords(sp.lat, sp.lng);
      }
    }
  }, [locationMode, selectedSpotId]);

  // Relative angle: diff between deviceHeading and windAngleDeg.
  const relativeAngle = ((windAngleDeg - deviceHeading + 360) % 360);

  // Tactical classification
  let tacticsTitle = '';
  let tacticsAdvice = '';
  let badgeColor = '';

  if (relativeAngle <= 35 || relativeAngle >= 325) {
    tacticsTitle = 'Headwind (Against)';
    tacticsAdvice = 'Casting distance decreases, but surface chop aggregates plankton and baitfish along the shoreline structure and reduces fish wariness. Prime opportunity to target immediate drop-offs, reef breaks, and riprap!';
    badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  } else if (relativeAngle >= 145 && relativeAngle <= 215) {
    tacticsTitle = 'Tailwind (Following)';
    tacticsAdvice = 'Air drag on lures is minimized, enabling massive casting distance! Target offshore breaks, current rips, and surface blitzes with long-casting spoons, heavy jigs, and poppers.';
    badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  } else {
    const isRightToLeft = relativeAngle > 35 && relativeAngle < 145;
    tacticsTitle = `Crosswind (${isRightToLeft ? 'Right → Left' : 'Left → Right'})`;
    tacticsAdvice = 'Beware of line bow and wind belly. Keep rod tip low near the water surface to mend line slack. Sinking pencils, compact casting jigs, and weighted rigs provide optimal control.';
    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  }

  // Heading cardinal string
  const getHeadingLabel = (deg: number): string => {
    const idx = Math.round(deg / 22.5) % 16;
    return WIND_DIRECTIONS_16[idx];
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[96vh] sm:max-h-[92vh]">
        
        {/* Mobile pull handle bar */}
        <div className="sm:hidden w-10 h-1 bg-slate-700 rounded-full mx-auto my-2 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 truncate">
                <span>Fishing Compass & Wind Tactics</span>
                <span className="hidden xs:inline-block px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 shrink-0">
                  Live Marine Sync
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 truncate">
                Analyze cast orientation and tactical wind angle in real time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          
          {/* Location Mode Switcher */}
          <div className="bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 flex items-center gap-1.5">
            <button
              onClick={() => {
                setLocationMode('gps');
                setIsCustomWind(false);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                locationMode === 'gps'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>My Location (GPS)</span>
              {locationMode === 'gps' && locatingStatus === 'locating' && (
                <RefreshCw className="w-3 h-3 animate-spin" />
              )}
            </button>

            <button
              onClick={() => {
                setLocationMode('spot');
                setIsCustomWind(false);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                locationMode === 'spot'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Choose Spot</span>
            </button>
          </div>

          {/* Spot Selector dropdown if in spot mode */}
          {locationMode === 'spot' && spots.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 shrink-0 font-medium">Fishing Spot:</span>
              <select
                value={selectedSpotId}
                onChange={(e) => {
                  setSelectedSpotId(e.target.value);
                  setIsCustomWind(false);
                }}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                {spots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Current Location & Live Wind Data Card */}
          <div className="p-3.5 bg-gradient-to-r from-slate-950 to-slate-900 rounded-2xl border border-slate-800/90 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-sky-950/70 text-sky-400 border border-sky-800/60">
                  {locationMode === 'gps' ? <Navigation className="w-4 h-4 text-sky-400" /> : <MapPin className="w-4 h-4 text-emerald-400" />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                    <span>{locationTitle}</span>
                    {locatingStatus === 'locating' && (
                      <span className="text-[10px] text-sky-400 font-normal animate-pulse">Locating...</span>
                    )}
                  </div>
                  {locatingStatus === 'locating' ? (
                    <div className="text-[10px] text-sky-400/80 animate-pulse">
                      Acquiring GPS satellites...
                    </div>
                  ) : coords ? (
                    <div className="text-[10px] text-slate-400 font-mono">
                      Lat {Math.abs(coords.lat).toFixed(3)}° {coords.lat >= 0 ? 'N' : 'S'}, Lng {Math.abs(coords.lng).toFixed(3)}° {coords.lng >= 0 ? 'E' : 'W'}
                    </div>
                  ) : null}
                </div>
              </div>

              <button
                onClick={() => {
                  if (locationMode === 'gps') {
                    acquireCurrentLocation();
                  } else if (coords) {
                    fetchWeatherForCoords(coords.lat, coords.lng);
                  }
                }}
                disabled={isLoadingWeather || locatingStatus === 'locating'}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-[11px] font-medium transition-colors border border-slate-700 shrink-0"
                title="Refresh live marine weather"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isLoadingWeather || locatingStatus === 'locating' ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Error banner if any */}
            {locationError && (
              <div className="p-2 bg-amber-950/50 border border-amber-800/60 rounded-xl text-[11px] text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span>{locationError}</span>
              </div>
            )}

            {/* Weather / Wind Details Grid */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/80">
              <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Wind className="w-3 h-3 text-cyan-400" />
                  Wind Dir
                </span>
                <span className="text-sm font-extrabold text-cyan-300 pt-0.5">
                  {windDir}
                  <span className="text-[10px] text-slate-400 font-normal ml-1 font-mono">({windAngleDeg}°)</span>
                </span>
              </div>

              <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-sky-400" />
                  Wind Speed
                </span>
                <span className="text-sm font-extrabold text-sky-300 pt-0.5">
                  {formatWind(windSpeed)}
                </span>
              </div>

              <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-amber-400" />
                  Temp / Pressure
                </span>
                <span className="text-xs font-bold text-slate-200 pt-0.5">
                  {temperature !== undefined ? formatTemp(temperature) : '-'}
                  <span className="text-[10px] text-slate-400 ml-1">
                    {pressureHpa ? `${pressureHpa} hPa` : ''}
                  </span>
                </span>
              </div>
            </div>

            {/* Live Data Badge */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live Open-Meteo Marine API Sync</span>
              </span>
              {lastRefreshedAt && (
                <span>{`Updated: ${lastRefreshedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}</span>
              )}
            </div>
          </div>

          {/* iOS Sensor activation banner */}
          {permissionState === 'prompt' && (
            <div className="p-3 bg-sky-950/50 border border-sky-800/60 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-sky-200">
                <Navigation className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Enable compass orientation sensors for live heading</span>
              </div>
              <button
                onClick={requestCompassPermission}
                className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-lg shrink-0 transition-colors shadow-sm"
              >
                Enable
              </button>
            </div>
          )}

          {/* Compass Visual Dial */}
          <div className="relative flex flex-col items-center justify-center py-2 select-none">
            {/* Top "Facing" Needle Indicator */}
            <div className="flex flex-col items-center mb-1">
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-rose-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-rose-400 tracking-wider">
                FACING (CAST DIRECTION)
              </span>
            </div>

            {/* Dial Circle */}
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full border-4 border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 shadow-2xl flex items-center justify-center overflow-hidden">
              
              {/* Rotating Compass Disc (rotates opposite of device heading) */}
              <div
                className="absolute inset-0 rounded-full transition-transform duration-150 ease-out"
                style={{ transform: `rotate(${-deviceHeading}deg)` }}
              >
                {/* Degree tick marks */}
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-1 left-1/2 -translate-x-1/2 w-[1.5px] h-2 bg-slate-700 origin-[center_108px] sm:origin-[center_124px]"
                    style={{ transform: `rotate(${i * 15}deg)` }}
                  />
                ))}

                {/* Cardinal Points */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 text-sm font-black text-rose-500 font-mono">
                  N
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-black text-sky-400 font-mono">
                  E
                </div>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-sm font-black text-amber-400 font-mono">
                  S
                </div>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-sky-400 font-mono">
                  W
                </div>

                {/* Wind Origin Vector Indicator on the Compass */}
                <div
                  className="absolute inset-0 pointer-events-none flex items-center justify-center transition-transform duration-300"
                  style={{ transform: `rotate(${windAngleDeg}deg)` }}
                >
                  <div className="relative -top-20 flex flex-col items-center animate-bounce">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-cyan-900/90 text-cyan-200 border border-cyan-500/50 shadow-md">
                      {`Wind ${windDir} (${formatWind(windSpeed)})`}
                    </span>
                    <Wind className="w-5 h-5 text-cyan-400" />
                  </div>
                </div>
              </div>

              {/* Center Hub */}
              <div className="relative z-10 w-24 h-24 rounded-full bg-slate-900/90 border border-slate-700/80 backdrop-blur-md flex flex-col items-center justify-center shadow-inner">
                <div className="text-xl font-mono font-black text-white">
                  {deviceHeading}°
                </div>
                <div className="text-[11px] font-bold text-sky-300">
                  {getHeadingLabel(deviceHeading)}
                </div>
              </div>
            </div>
          </div>

          {/* Tactical Assessment Card */}
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 shrink-0">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Cast Tactical Assessment</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap shrink-0 ml-2 ${badgeColor}`}>
                {tacticsTitle}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              {tacticsAdvice}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-400 border-t border-slate-800/80">
              <div>
                <span>Wind Vector: </span>
                <strong className="text-white font-mono">{windAngleDeg}° ({windDir})</strong>
              </div>
              <div>
                <span>Relative Angle: </span>
                <strong className="text-white font-mono">{Math.round(relativeAngle)}°</strong>
              </div>
            </div>
          </div>

          {/* Manual Wind Simulation / Adjustment Collapsible */}
          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-cyan-400" />
                Simulate Custom Wind Direction & Speed
              </span>
              {isCustomWind && (
                <button
                  onClick={() => {
                    setIsCustomWind(false);
                    if (coords) fetchWeatherForCoords(coords.lat, coords.lng);
                  }}
                  className="text-[10px] text-sky-400 hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset to Live
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1">
              {WIND_DIRECTIONS_16.map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setWindDir(d);
                    setIsCustomWind(true);
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                    windDir === d
                      ? 'bg-cyan-500 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <div className="pt-2 flex items-center gap-3">
              <span className="text-slate-400 text-[11px] shrink-0">
                Wind: {formatWind(windSpeed)}
              </span>
              <input
                type="range"
                min="0"
                max="15"
                step="0.5"
                value={windSpeed}
                onChange={(e) => {
                  setWindSpeed(parseFloat(e.target.value));
                  setIsCustomWind(true);
                }}
                className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
