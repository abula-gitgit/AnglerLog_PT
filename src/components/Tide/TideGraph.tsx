import React, { useState, useEffect, useMemo } from 'react';
import { 
  calculateDayTideData, 
  fetchGlobalMarineAndTide,
  TidePrimeTime, 
  TideDayData, 
  fetchLiveMarineConditions, 
  LiveMarineData 
} from '../../services/tideService';
import { fetchDayWeatherSummary, DayWeatherSummary, HourlyForecastItem } from '../../services/weatherService';
import { TideState, TideName } from '../../types/fishing';
import { useLanguage } from '../../i18n/LanguageContext';
import { 
  Waves, ChevronLeft, ChevronRight, Clock, Calendar, 
  ArrowUpRight, ArrowDownRight, Minus, Sparkles, X,
  Wind, Navigation, RefreshCw, Sun, Cloud, CloudRain, Globe
} from 'lucide-react';
import { formatTideName, formatTideState } from '../../utils/formatI18n';

export interface TideGraphProps {
  spotName?: string;
  lat?: number;
  lng?: number;
  initialDate?: Date;
  selectedTime?: string; // HH:mm
  onClose?: () => void;
  onSelectTime?: (time: string, tideState: TideState, tideName: TideName) => void;
  compact?: boolean;
}

export const TideGraph: React.FC<TideGraphProps> = ({
  spotName,
  lat = 35.65,
  lng = 139.75,
  initialDate = new Date(),
  selectedTime,
  onClose,
  onSelectTime,
  compact = false,
}) => {
  const { isEn, unitSystem, setUnitSystem, formatTide, formatWind, formatTemp, formatWave, units } = useLanguage();
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [hoveredTime, setHoveredTime] = useState<string | null>(null);
  const [weatherSummary, setWeatherSummary] = useState<DayWeatherSummary | null>(null);
  const [marineData, setMarineData] = useState<LiveMarineData | null>(null);
  const [enhancedTide, setEnhancedTide] = useState<TideDayData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState<boolean>(false);

  // Load weather, global marine swell, and NOAA / Open-Meteo tide data
  useEffect(() => {
    let isMounted = true;
    const loadWeatherAndTides = async () => {
      setLoadingWeather(true);
      try {
        const [weatherRes, enhancedTideRes] = await Promise.all([
          fetchDayWeatherSummary(lat, lng, currentDate),
          fetchGlobalMarineAndTide(lat, lng, currentDate),
        ]);
        if (isMounted) {
          setWeatherSummary(weatherRes);
          setEnhancedTide(enhancedTideRes);
          setMarineData(enhancedTideRes.marine || null);
        }
      } catch (err) {
        console.warn('Tide weather summary fetch error:', err);
      } finally {
        if (isMounted) setLoadingWeather(false);
      }
    };
    loadWeatherAndTides();
    return () => { isMounted = false; };
  }, [currentDate, lat, lng]);

  const targetDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

  const tideData: TideDayData = useMemo(() => {
    if (enhancedTide && enhancedTide.date === targetDateStr) {
      return enhancedTide;
    }
    return calculateDayTideData(currentDate, lng, lat);
  }, [currentDate, lng, lat, enhancedTide, targetDateStr]);

  const handlePrevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // SVG dimensions tuned for crisp display on both mobile and desktop
  const svgWidth = 560;
  const svgHeight = 220;
  const paddingX = 36;
  const paddingTop = 26;
  const paddingBottom = 32;

  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Find min & max tide heights for scaling
  const minHeight = Math.min(...tideData.hourlyCurve.map((c) => c.heightCm)) - 10;
  const maxHeight = Math.max(...tideData.hourlyCurve.map((c) => c.heightCm)) + 15;
  const heightRange = Math.max(maxHeight - minHeight, 40);

  // Helper coordinate mapper
  const getX = (hourFloat: number) => paddingX + (hourFloat / 24) * chartWidth;
  const getY = (hCm: number) => paddingTop + chartHeight - ((hCm - minHeight) / heightRange) * chartHeight;

  // Build SVG Path
  const points = tideData.hourlyCurve.map((pt) => {
    const hFloat = pt.hour + pt.minute / 60;
    return { x: getX(hFloat), y: getY(pt.heightCm), pt };
  });

  // Smooth SVG path command
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    pathD += ` L ${points[i].x} ${points[i].y}`;
  }

  // Area path for gradient fill down to baseline
  const areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;

  // Active / current time indicator
  const now = new Date();
  const isCurrentDayToday = currentDate.toDateString() === now.toDateString();
  const activeTimeStr = hoveredTime || selectedTime || (isCurrentDayToday ? `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}` : '12:00');
  
  const [activeHour, activeMin] = activeTimeStr.split(':').map(Number);
  const activeFractionalHour = (activeHour || 0) + (activeMin || 0) / 60;
  const activeX = getX(activeFractionalHour);

  // Find sample closest to active time
  const activeSample = tideData.hourlyCurve.find((c) => Math.abs((c.hour + c.minute / 60) - activeFractionalHour) < 0.25) || tideData.hourlyCurve[Math.floor(tideData.hourlyCurve.length / 2)];
  const activeY = getY(activeSample.heightCm);

  // Find active hour's wind data
  const activeHourWind = useMemo<HourlyForecastItem | null>(() => {
    if (!weatherSummary || !weatherSummary.hourly || weatherSummary.hourly.length === 0) return null;
    const found = weatherSummary.hourly.find((h) => h.hour === activeHour);
    return found || weatherSummary.hourly[0];
  }, [weatherSummary, activeHour]);

  // Wind strength assessment helper (with short label for tight mobile screens)
  const getWindQuality = (speed: number) => {
    if (speed < 2.0) {
      return { 
        label: 'Calm / Light Air', 
        shortLabel: 'Optimal Calm',
        color: 'text-emerald-300 bg-emerald-950/70 border-emerald-800' 
      };
    }
    if (speed < 4.5) {
      return { 
        label: 'Good Cast / Moderate', 
        shortLabel: 'Good Cast',
        color: 'text-cyan-300 bg-cyan-950/70 border-cyan-800' 
      };
    }
    if (speed < 7.0) {
      return { 
        label: 'Breezy / Watch Line Belly', 
        shortLabel: 'Line Belly',
        color: 'text-amber-300 bg-amber-950/70 border-amber-800' 
      };
    }
    return { 
      label: 'High Wind / Rough Surface', 
      shortLabel: 'High Wind',
      color: 'text-rose-300 bg-rose-950/70 border-rose-800' 
    };
  };

  const getWeatherIcon = (cond?: string) => {
    if (cond === 'cloudy') return <Cloud className="w-3.5 h-3.5 text-slate-300 shrink-0" />;
    if (cond === 'rain' || cond === 'heavy_rain') return <CloudRain className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
    return <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
  };

  // Interactive scrubber on click or touch drag
  const handlePointerInteraction = (clientX: number, target: SVGSVGElement) => {
    const rect = target.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, (clickX - (paddingX / svgWidth) * rect.width) / ((chartWidth / svgWidth) * rect.width)));
    const clickedHourFloat = ratio * 24;
    const h = Math.min(23, Math.max(0, Math.floor(clickedHourFloat)));
    const m = Math.min(50, Math.max(0, Math.floor(((clickedHourFloat % 1) * 60) / 10) * 10));
    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    
    const sample = tideData.hourlyCurve.find((c) => c.hour === h && Math.abs(c.minute - m) <= 15) || activeSample;
    setHoveredTime(timeStr);
    if (onSelectTime) {
      onSelectTime(timeStr, sample.state, tideData.tideName);
    }
  };

  return (
    <div className={`flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden text-slate-100 ${compact ? 'p-2.5' : 'p-3 sm:p-5'}`}>
      {/* Header: Responsive Mobile-first layout */}
      <div className="pb-3 border-b border-slate-800 flex flex-col gap-2.5">
        {/* Top Row: Icon, Title, Tide Badge, Close Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
              <Waves className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                Tide Graph & Marine Forecast
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border shrink-0 ${
                formatTideName(tideData.tideName) === 'Spring Tide' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                formatTideName(tideData.tideName) === 'Mid Tide' ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' :
                formatTideName(tideData.tideName) === 'Neap Tide' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                'bg-slate-700/50 text-slate-300 border-slate-600'
              }`}>
                {formatTideName(tideData.tideName)}
              </span>

              {/* Data Source Badge */}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950/80 border border-slate-800 text-slate-300 flex items-center gap-1 shrink-0">
                {tideData.dataSource === 'noaa' ? (
                  <span className="text-emerald-300 font-semibold flex items-center gap-1">
                    <span>🇺🇸</span>
                    <span>NOAA CO-OPS ({tideData.stationName || 'US Station'})</span>
                  </span>
                ) : tideData.dataSource === 'open-meteo' ? (
                  <span className="text-cyan-300 font-semibold flex items-center gap-1">
                    <span>🌊</span>
                    <span>Open-Meteo Marine + Swell</span>
                  </span>
                ) : (
                  <span className="text-slate-400 flex items-center gap-1">
                    <span>🌒</span>
                    <span>Harmonic Global Model</span>
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Unit Toggle inside Tide Modal */}
            <button
              onClick={() => setUnitSystem(unitSystem === 'metric' ? 'imperial' : 'metric')}
              className="px-2 py-1 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-sky-300 hover:text-white rounded-lg text-[11px] font-bold shadow-sm transition-all flex items-center gap-1 shrink-0"
              title={unitSystem === 'metric' ? 'Metric (cm/ms) → Switch to Imperial (ft/kt)' : 'Imperial (ft/kt) → Switch to Metric (cm/ms)'}
            >
              <span>📐</span>
              <span className="font-mono">{unitSystem === 'metric' ? 'cm/ms' : 'ft/kt'}</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 -mr-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Live Marine Swell & Wave conditions banner */}
        {tideData.marine && tideData.marine.waveHeightM !== undefined && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-950/90 rounded-xl border border-cyan-900/40 text-xs">
            <div className="flex items-center gap-2 text-cyan-300">
              <Waves className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-bold">
                Ocean Swell & Wave:
              </span>
              <span className="font-mono font-bold text-white text-xs sm:text-sm">
                {formatWave(tideData.marine.waveHeightM)}
              </span>
              {tideData.marine.wavePeriodS && (
                <span className="text-[11px] text-slate-400 font-mono">
                  ({tideData.marine.wavePeriodS}s period)
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-300 font-medium">
              <span>{tideData.marine.seaConditionDescriptionEn || tideData.marine.seaConditionDescription}</span>
            </div>
          </div>
        )}

        {/* Subtitle & Date Navigation Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-400 flex-wrap">
            <span className="font-medium text-slate-300 truncate max-w-[170px] sm:max-w-none">
              {spotName ? `Near ${spotName}` : 'Coastal Waters'}
            </span>
            <span>•</span>
            <span className="shrink-0">{tideData.moonDescription}</span>
            {weatherSummary?.isLiveApi && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-medium shrink-0">
                Live Weather Connected
              </span>
            )}
          </div>

          {/* Mobile-friendly Date Stepper */}
          <div className="flex items-center gap-1 sm:gap-1.5 self-center sm:self-auto w-full sm:w-auto justify-between sm:justify-end bg-slate-950/70 p-1 sm:p-0 rounded-lg sm:bg-transparent border sm:border-0 border-slate-800">
            <button
              onClick={handlePrevDay}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center justify-center min-w-[34px]"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5 flex-1 sm:flex-initial justify-center"
              title="Return to Today"
            >
              <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>{currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}</span>
              {!isCurrentDayToday && (
                <span className="text-[10px] px-1 rounded bg-sky-500/20 text-sky-300 ml-1">Today</span>
              )}
            </button>

            <button
              onClick={handleNextDay}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center justify-center min-w-[34px]"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Live Status Strip with Integrated Wind & Tide */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-2.5 p-2 sm:p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
        {/* 1. Time & Weather */}
        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/60 min-w-0">
          <div className="text-[10px] sm:text-[11px] text-slate-400 flex items-center justify-between">
            <span className="truncate">Time</span>
            {activeHourWind && (
              <span className="flex items-center gap-1 text-[10px] text-amber-300 font-medium whitespace-nowrap shrink-0">
                {getWeatherIcon(activeHourWind.condition)}
                <span>{formatTemp(activeHourWind.temperature)}</span>
              </span>
            )}
          </div>
          <div className="font-mono font-bold text-white text-sm sm:text-base mt-0.5 flex items-center gap-1 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>{activeTimeStr}</span>
          </div>
        </div>

        {/* 2. Tide Height & State */}
        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/60 min-w-0">
          <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">Height</div>
          <div className="font-mono font-bold text-cyan-300 text-sm sm:text-base mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span className="whitespace-nowrap">{formatTide(activeSample.heightCm)}</span>
            <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 whitespace-nowrap shrink-0">
              {formatTideState(activeSample.state)}
            </span>
          </div>
        </div>

        {/* 3. Tide Flow */}
        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/60 min-w-0">
          <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">Flow Direction</div>
          <div className="font-semibold text-xs sm:text-sm mt-0.5 flex items-center gap-1 whitespace-nowrap truncate">
            {tideData.currentFlowDirection === 'rising' ? (
              <span className="flex items-center gap-1 text-sky-400 whitespace-nowrap truncate">
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" /> Flood (Rising)
              </span>
            ) : tideData.currentFlowDirection === 'falling' ? (
              <span className="flex items-center gap-1 text-amber-400 whitespace-nowrap truncate">
                <ArrowDownRight className="w-3.5 h-3.5 shrink-0" /> Ebb (Falling)
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-400 whitespace-nowrap truncate">
                <Minus className="w-3.5 h-3.5 shrink-0" /> Slack Water
              </span>
            )}
          </div>
        </div>

        {/* 4. Wind & Quality */}
        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/60 min-w-0">
          <div className="text-[10px] sm:text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1 truncate">
              <Wind className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="truncate">Wind Forecast</span>
            </span>
            {loadingWeather && <RefreshCw className="w-2.5 h-2.5 animate-spin text-sky-400 shrink-0" />}
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-1 flex-wrap">
            {activeHourWind ? (
              <>
                <div className="flex items-center gap-1 text-cyan-300 font-bold text-xs sm:text-sm truncate">
                  <Navigation 
                    className="w-3.5 h-3.5 text-cyan-400 shrink-0" 
                    style={{ transform: `rotate(${activeHourWind.windDirectionDeg}deg)` }} 
                  />
                  <span className="truncate">{activeHourWind.windDirection}</span>
                  <span className="font-mono font-bold text-white text-xs sm:text-sm ml-0.5 whitespace-nowrap">
                    {formatWind(activeHourWind.windSpeedMs)}
                  </span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold shrink-0 whitespace-nowrap ${getWindQuality(activeHourWind.windSpeedMs).color}`}>
                  {getWindQuality(activeHourWind.windSpeedMs).shortLabel}
                </span>
              </>
            ) : (
              <span className="text-slate-400 text-xs whitespace-nowrap">Fetching data...</span>
            )}
          </div>
        </div>
      </div>

      {/* Quick High/Low Tides Summary Bar */}
      <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 mb-2 bg-slate-950/60 rounded-lg border border-slate-800/70 text-xs overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-bold text-rose-400 shrink-0">
            ▲ High:
          </span>
          {tideData.highTides.map((ht, i) => (
            <button
              key={`ht-${i}`}
              type="button"
              onClick={() => {
                setHoveredTime(ht.time);
                if (onSelectTime) onSelectTime(ht.time, 'Hochwasser (HW)', tideData.tideName);
              }}
              className="px-1.5 py-0.5 rounded bg-rose-950/70 hover:bg-rose-900/80 border border-rose-800/60 text-[11px] font-mono font-medium text-rose-200 transition-colors"
            >
              {ht.time} ({formatTide(ht.heightCm)})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <span className="text-[11px] font-bold text-cyan-400 shrink-0">
            ▼ Low:
          </span>
          {tideData.lowTides.map((lt, i) => (
            <button
              key={`lt-${i}`}
              type="button"
              onClick={() => {
                setHoveredTime(lt.time);
                if (onSelectTime) onSelectTime(lt.time, 'Niedrigwasser (NW)', tideData.tideName);
              }}
              className="px-1.5 py-0.5 rounded bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-800/60 text-[11px] font-mono font-medium text-cyan-200 transition-colors"
            >
              {lt.time} ({formatTide(lt.heightCm)})
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Tide Curve Canvas / SVG with Touch & Pointer Scrubbing */}
      <div className="relative w-full bg-slate-950/90 rounded-xl p-1.5 sm:p-2 border border-slate-800/80 overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto cursor-crosshair select-none touch-none"
          onClick={(e) => handlePointerInteraction(e.clientX, e.currentTarget)}
          onTouchStart={(e) => {
            if (e.touches[0]) handlePointerInteraction(e.touches[0].clientX, e.currentTarget);
          }}
          onTouchMove={(e) => {
            if (e.touches[0]) handlePointerInteraction(e.touches[0].clientX, e.currentTarget);
          }}
        >
          <defs>
            <linearGradient id="tideGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#0284c7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="primeZoneGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Prime Times Shading on the Chart */}
          {tideData.primeTimes.map((pt, idx) => {
            const [sh, sm] = pt.startTime.split(':').map(Number);
            const [eh, em] = pt.endTime.split(':').map(Number);
            const x1 = getX(sh + sm / 60);
            const x2 = getX(eh + em / 60);
            return (
              <g key={`prime-rect-${idx}`}>
                <rect
                  x={x1}
                  y={paddingTop}
                  width={Math.max(x2 - x1, 4)}
                  height={chartHeight}
                  fill="url(#primeZoneGrad)"
                />
                <text
                  x={(x1 + x2) / 2}
                  y={paddingTop + 14}
                  fill="#34d399"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  ★ Prime Bite
                </text>
              </g>
            );
          })}

          {/* Horizontal Grid lines (height in cm) */}
          {[0, 50, 100, 150].map((hVal) => {
            if (hVal < minHeight || hVal > maxHeight) return null;
            const y = getY(hVal);
            return (
              <g key={`grid-h-${hVal}`}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={paddingX + chartWidth}
                  y2={y}
                  stroke="#334155"
                  strokeWidth="0.8"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingX - 6}
                  y={y + 3.5}
                  fill="#64748b"
                  fontSize="9.5"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {hVal}
                </text>
              </g>
            );
          })}

          {/* Vertical Grid lines & Hour labels (every 3 hours) */}
          {Array.from({ length: 9 }).map((_, i) => {
            const h = i * 3;
            const x = getX(h);
            return (
              <g key={`grid-v-${h}`}>
                <line
                  x1={x}
                  y1={paddingTop}
                  x2={x}
                  y2={paddingTop + chartHeight}
                  stroke="#1e293b"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={paddingTop + chartHeight + 15}
                  fill="#94a3b8"
                  fontSize="10.5"
                  fontWeight="600"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {h}
                </text>
              </g>
            );
          })}

          {/* Baseline */}
          <line
            x1={paddingX}
            y1={paddingTop + chartHeight}
            x2={paddingX + chartWidth}
            y2={paddingTop + chartHeight}
            stroke="#475569"
            strokeWidth="1.2"
          />

          {/* Filled Tide Area */}
          <path d={areaD} fill="url(#tideGradient)" />

          {/* Tide Curve Stroke */}
          <path
            d={pathD}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* High Tide Markers with clean 2-line badges */}
          {tideData.highTides.map((ht, idx) => {
            const [h, m] = ht.time.split(':').map(Number);
            const x = getX(h + m / 60);
            const y = getY(ht.heightCm);
            const pillX = Math.max(paddingX, Math.min(paddingX + chartWidth - 66, x - 33));
            const pillY = Math.max(paddingTop + 2, y - 28);

            return (
              <g key={`high-${idx}`}>
                <circle cx={x} cy={y} r="4.5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
                <rect
                  x={pillX}
                  y={pillY}
                  width="66"
                  height="24"
                  rx="4"
                  fill="#1e1b4b"
                  stroke="#f43f5e"
                  strokeWidth="1"
                />
                <text
                  x={pillX + 33}
                  y={pillY + 10}
                  fill="#fda4af"
                  fontSize="9.5"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  ▲ High {ht.time}
                </text>
                <text
                  x={pillX + 33}
                  y={pillY + 20}
                  fill="#ffffff"
                  fontSize="8.5"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {formatTide(ht.heightCm)}
                </text>
              </g>
            );
          })}

          {/* Low Tide Markers with clean 2-line badges */}
          {tideData.lowTides.map((lt, idx) => {
            const [h, m] = lt.time.split(':').map(Number);
            const x = getX(h + m / 60);
            const y = getY(lt.heightCm);
            const pillX = Math.max(paddingX, Math.min(paddingX + chartWidth - 66, x - 33));
            const pillY = Math.min(paddingTop + chartHeight - 26, y + 8);

            return (
              <g key={`low-${idx}`}>
                <circle cx={x} cy={y} r="4.5" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" />
                <rect
                  x={pillX}
                  y={pillY}
                  width="66"
                  height="24"
                  rx="4"
                  fill="#083344"
                  stroke="#06b6d4"
                  strokeWidth="1"
                />
                <text
                  x={pillX + 33}
                  y={pillY + 10}
                  fill="#67e8f9"
                  fontSize="9.5"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  ▼ Low {lt.time}
                </text>
                <text
                  x={pillX + 33}
                  y={pillY + 20}
                  fill="#ffffff"
                  fontSize="8.5"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {formatTide(lt.heightCm)}
                </text>
              </g>
            );
          })}

          {/* Active / scrubber vertical line */}
          <line
            x1={activeX}
            y1={paddingTop - 4}
            x2={activeX}
            y2={paddingTop + chartHeight}
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="3 2"
          />
          <circle
            cx={activeX}
            cy={activeY}
            r="5.5"
            fill="#f59e0b"
            stroke="#ffffff"
            strokeWidth="2"
          />
          <rect
            x={Math.max(paddingX, Math.min(paddingX + chartWidth - 68, activeX - 34))}
            y={paddingTop - 20}
            width="68"
            height="16"
            rx="4"
            fill="#b45309"
            stroke="#f59e0b"
            strokeWidth="0.8"
          />
          <text
            x={Math.max(paddingX + 34, Math.min(paddingX + chartWidth - 34, activeX))}
            y={paddingTop - 8}
            fill="#ffffff"
            fontSize="9"
            fontWeight="bold"
            textAnchor="middle"
          >
            {activeTimeStr} ({activeSample.heightCm}cm)
          </text>
        </svg>

        <div className="text-[10px] text-slate-400 text-center mt-1">
          ※ Tap or drag pointer across chart to inspect water level & wind speed at any hour
        </div>
      </div>

      {/* 24-Hour Wind & Weather Timeline Strip (Horizontal swipe track on smartphone) */}
      <div className="mt-2.5 p-2.5 sm:p-3 bg-slate-950/70 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-xs">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-cyan-400" />
            <span>24-Hour Wind & Marine Timeline</span>
          </span>
          <span className="text-[10px] text-slate-400">
            Tap hour to jump scrubber
          </span>
        </div>

        {/* Responsive rail: swipeable single row on smartphone, 8-col grid on larger screens */}
        <div className="flex sm:grid sm:grid-cols-8 gap-1.5 pt-2 overflow-x-auto pb-1 scrollbar-none">
          {[0, 3, 6, 9, 12, 15, 18, 21].map((hour) => {
            const hData = weatherSummary?.hourly.find((item) => item.hour === hour);
            const isSelected = activeHour === hour;
            const speed = hData?.windSpeedMs ?? 2.5;
            const quality = getWindQuality(speed);
            const sample = tideData.hourlyCurve.find((c) => c.hour === hour) || activeSample;

            return (
              <button
                key={hour}
                type="button"
                onClick={() => {
                  const timeStr = `${String(hour).padStart(2, '0')}:00`;
                  setHoveredTime(timeStr);
                  if (onSelectTime) {
                    onSelectTime(timeStr, sample.state, tideData.tideName);
                  }
                }}
                className={`p-2 rounded-xl text-center transition-all flex flex-col items-center shrink-0 w-[76px] sm:w-auto border ${
                  isSelected
                    ? 'bg-sky-950/90 border-sky-400 shadow-md ring-1 ring-sky-400/50'
                    : 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800/80'
                }`}
              >
                <div className="text-[10px] font-mono text-slate-400 font-semibold">
                  {String(hour).padStart(2, '0')}:00
                </div>

                {/* Weather condition */}
                <div className="my-1">
                  {getWeatherIcon(hData?.condition)}
                </div>

                {/* Rotating wind arrow */}
                <div className="my-0.5">
                  <Navigation
                    className="w-3.5 h-3.5 text-cyan-400"
                    style={{ transform: `rotate(${hData?.windDirectionDeg ?? 45}deg)` }}
                  />
                </div>

                {/* Cardinal direction */}
                <div className="text-[10px] font-bold text-slate-200 truncate max-w-full">
                  {hData?.windDirection || '-'}
                </div>

                {/* Speed badge */}
                <div className={`mt-1 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${quality.color}`}>
                  {formatWind(speed)}
                </div>

                {/* Tide height at this hour */}
                <div className="mt-1 text-[9px] text-slate-400 font-mono">
                  {formatTide(sample.heightCm)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Prime Times List with Wind Info */}
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>Today's Prime Bite Windows (Tide × Wind Forecast)</span>
          </div>
          <span className="text-[10px] text-slate-400 font-normal">Tap to inspect bite window</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {tideData.primeTimes.map((pt, idx) => {
            const [sh] = pt.startTime.split(':').map(Number);
            const ptWind = weatherSummary?.hourly.find((h) => h.hour === sh);
            const speed = ptWind?.windSpeedMs ?? 2.5;
            const quality = getWindQuality(speed);

            return (
              <div
                key={idx}
                onClick={() => {
                  setHoveredTime(pt.startTime);
                  if (onSelectTime) {
                    onSelectTime(pt.startTime, 'Rising (Late)', tideData.tideName);
                  }
                }}
                className="p-2.5 sm:p-3 bg-slate-950/60 hover:bg-slate-800/80 transition-colors border border-slate-800 rounded-xl cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                    {pt.name}
                  </span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 rounded-md shrink-0">
                    {pt.startTime} 〜 {pt.endTime}
                  </span>
                </div>

                {/* Wind prediction for prime time */}
                {ptWind && (
                  <div className="flex items-center justify-between gap-1.5 mt-1.5 pt-1.5 border-t border-slate-800/60 text-[11px] flex-wrap">
                    <span className="flex items-center gap-1 text-cyan-300 font-medium">
                      <Navigation 
                        className="w-3 h-3 text-cyan-400 shrink-0" 
                        style={{ transform: `rotate(${ptWind.windDirectionDeg}deg)` }} 
                      />
                      <span>Wind: <strong>{ptWind.windDirection}</strong></span>
                      <span className="font-mono text-slate-200 ml-1">
                        {formatWind(ptWind.windSpeedMs)}
                      </span>
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${quality.color}`}>
                      {quality.shortLabel}
                    </span>
                  </div>
                )}

                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  {pt.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
