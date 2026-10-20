import React, { useState, useMemo } from 'react';
import { FishingSpot, CatchLog, WeatherData } from '../../types/fishing';
import { 
  analyzeHitPatternAndPredict, 
  HitPatternPredictionResult,
  RecommendedTimeWindow 
} from '../../services/patternPredictionService';
import { 
  Target, Sparkles, TrendingUp, Clock, Waves, Compass, 
  Award, X, CheckCircle2, MapPin, Wind, Zap, Info,
  Flame, ChevronRight, BarChart3, ShieldCheck, ChevronDown, Filter
} from 'lucide-react';

interface PatternPredictionModalProps {
  spots: FishingSpot[];
  catches: CatchLog[];
  currentSpot?: FishingSpot;
  currentWeather?: WeatherData;
  onClose: () => void;
  onSelectSpot?: (spot: FishingSpot) => void;
}

type TabType = 'all' | 'windows' | 'tactics' | 'stats';

export const PatternPredictionModal: React.FC<PatternPredictionModalProps> = ({
  spots,
  catches,
  currentSpot,
  currentWeather,
  onClose,
  onSelectSpot,
}) => {
  const [selectedSpotId, setSelectedSpotId] = useState<string>(currentSpot?.id || 'all');
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const activeSpot = useMemo(() => {
    if (selectedSpotId === 'all') return undefined;
    return spots.find((s) => s.id === selectedSpotId);
  }, [selectedSpotId, spots]);

  const prediction = useMemo(() => {
    return analyzeHitPatternAndPredict(catches, activeSpot, new Date(), currentWeather);
  }, [catches, activeSpot, currentWeather]);

  // Spot catches count helper for chips
  const spotCatchCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    catches.forEach((c) => {
      if (!c.isNoCatch && c.spotId) {
        map[c.spotId] = (map[c.spotId] || 0) + (c.quantity || 1);
      }
    });
    return map;
  }, [catches]);

  const totalValidCatches = useMemo(() => {
    return catches.filter((c) => !c.isNoCatch).length;
  }, [catches]);

  // Determine if a recommended time window is happening NOW
  const isTimeWindowActiveNow = (tw: RecommendedTimeWindow) => {
    try {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const [startH, startM] = tw.startTime.split(':').map(Number);
      const [endH, endM] = tw.endTime.split(':').map(Number);

      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (startMinutes <= endMinutes) {
        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
      } else {
        // Over midnight case
        return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
      }
    } catch {
      return false;
    }
  };

  const getScoreGradeInfo = (grade: 'S' | 'A' | 'B' | 'C') => {
    switch (grade) {
      case 'S':
        return {
          badge: 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-900/60 border border-rose-400/50',
          label: 'Prime Bite',
          color: 'text-rose-400',
          barColor: 'from-rose-500 via-pink-500 to-amber-400',
        };
      case 'A':
        return {
          badge: 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-lg shadow-amber-900/50 border border-amber-300',
          label: 'Great Window',
          color: 'text-amber-400',
          barColor: 'from-amber-400 via-yellow-400 to-emerald-400',
        };
      case 'B':
        return {
          badge: 'bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-lg shadow-sky-900/50 border border-sky-400/50',
          label: 'Favorable',
          color: 'text-sky-400',
          barColor: 'from-sky-500 via-indigo-500 to-cyan-400',
        };
      case 'C':
      default:
        return {
          badge: 'bg-slate-700 text-slate-200 border border-slate-600',
          label: 'Technical',
          color: 'text-slate-400',
          barColor: 'from-slate-600 to-slate-500',
        };
    }
  };

  const gradeInfo = getScoreGradeInfo(prediction.scoreGrade);

  return (
    <div className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[96vh] sm:max-h-[90vh]">
        
        {/* Mobile Drag Indicator Bar */}
        <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mt-2 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-2 sm:px-5 sm:py-3 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shrink-0 shadow-inner">
              <Target className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-base font-bold text-white truncate flex items-center gap-1.5">
                <span>Hit Pattern & Bite Predictor</span>
                <span className="hidden xs:inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-800/60">
                  AI Analyzer
                </span>
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">Synthesizing personal catch records, tide curves & weather data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Compact Single-Row Controls */}
        <div className="px-3 py-2 sm:px-4 sm:py-2.5 bg-slate-950 border-b border-slate-800 flex items-center gap-2 text-xs shrink-0">
          {/* Dropdown 1: Target Spot Selector */}
          <div className="relative flex-1 min-w-0">
            <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-sky-400">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <select
              value={selectedSpotId}
              onChange={(e) => {
                setSelectedSpotId(e.target.value);
                if (onSelectSpot) {
                  const s = spots.find((sp) => sp.id === e.target.value);
                  if (s) onSelectSpot(s);
                }
              }}
              className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-700/80 hover:border-slate-600 rounded-xl pl-8 pr-7 py-1.5 text-[11px] sm:text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-sky-500 truncate cursor-pointer appearance-none shadow-sm transition-colors"
            >
              <option value="all" className="bg-slate-900 text-white font-medium">
                📍 All Spots Combined ({totalValidCatches} logs)
              </option>
              {spots.map((spot) => {
                const count = spotCatchCountMap[spot.id] || 0;
                return (
                  <option key={spot.id} value={spot.id} className="bg-slate-900 text-white font-medium">
                    📍 {spot.name} {count > 0 ? `(${count})` : '(0)'}
                  </option>
                );
              })}
            </select>
            <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-slate-400">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Dropdown 2: Section View Filter */}
          <div className="relative flex-1 min-w-0">
            <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-purple-400">
              <Filter className="w-3.5 h-3.5" />
            </div>
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as TabType)}
              className="w-full bg-slate-900 hover:bg-slate-855 border border-slate-700/80 hover:border-slate-600 rounded-xl pl-8 pr-7 py-1.5 text-[11px] sm:text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-purple-500 truncate cursor-pointer appearance-none shadow-sm transition-colors"
            >
              <option value="all" className="bg-slate-900 text-white font-medium">
                📋 All Sections
              </option>
              <option value="windows" className="bg-slate-900 text-white font-medium">
                ⏰ Prime Windows ({prediction.recommendedTimeWindows.length})
              </option>
              <option value="tactics" className="bg-slate-900 text-white font-medium">
                💡 Tactical Advice ({prediction.tacticalAdvices.length})
              </option>
              <option value="stats" className="bg-slate-900 text-white font-medium">
                📊 Historical Data ({prediction.totalCatchesAnalyzed})
              </option>
            </select>
            <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-slate-400">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-3 sm:p-4.5 overflow-y-auto space-y-3 sm:space-y-4">
          
          {/* Main Score Hero Card */}
          {(activeTab === 'all' || activeTab === 'windows') && (
            <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 rounded-2xl border border-slate-800 shadow-xl space-y-3 relative overflow-hidden">
              
              {/* Background Glow */}
              <div className="absolute -top-16 -right-16 w-36 h-36 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between gap-2">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Today's Bite Potential</span>
                  </span>
                  <p className="text-[10px] text-slate-400 truncate">
                    {activeSpot ? `📍 ${activeSpot.name}` : '📍 Combined Field Analysis'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="flex items-baseline justify-end">
                      <span className="text-2xl sm:text-3xl font-black font-mono text-white leading-none">
                        {prediction.todayScore}
                      </span>
                      <span className="text-[11px] font-normal text-slate-400 ml-0.5">/100</span>
                    </div>
                  </div>
                  <div className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1 text-xs font-black shadow-md whitespace-nowrap shrink-0 ${gradeInfo.badge}`}>
                    <span>{prediction.scoreGrade}</span>
                    <span className="text-[10px] font-bold opacity-90 hidden xs:inline">{gradeInfo.label}</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Score Bar */}
              <div className="space-y-1">
                <div className="w-full h-2.5 bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${gradeInfo.barColor} transition-all duration-700 shadow-sm`}
                    style={{ width: `${prediction.todayScore}%` }}
                  />
                </div>
              </div>

              {/* Headline Callout */}
              <div className="p-2.5 sm:p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs font-bold text-slate-100 leading-relaxed flex items-start gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="break-words">{prediction.headline}</span>
              </div>

              {/* Environmental Context Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1 border-t border-slate-800/80">
                <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800/60">
                  <span className="text-slate-400 text-[10px] block">Tide Cycle</span>
                  <span className="font-bold text-sky-400">{prediction.todayTideName} (Moon {prediction.todayMoonAge}d)</span>
                </div>
                <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800/60">
                  <span className="text-slate-400 text-[10px] block">Current Flow State</span>
                  <span className="font-bold text-cyan-300 truncate block" title={prediction.currentFlowDescription}>
                    {prediction.currentFlowDescription}
                  </span>
                </div>
                {currentWeather ? (
                  <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800/60">
                    <span className="text-slate-400 text-[10px] block">Wind & Speed</span>
                    <span className="font-bold text-emerald-300 truncate block">
                      {currentWeather.windDirection || 'Wind'} {currentWeather.windSpeedMs != null ? `${currentWeather.windSpeedMs} m/s` : '-'}
                    </span>
                  </div>
                ) : (
                  <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800/60">
                    <span className="text-slate-400 text-[10px] block">Solunar Model</span>
                    <span className="font-bold text-slate-300">Tide Sync Active</span>
                  </div>
                )}
                <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800/60">
                  <span className="text-slate-400 text-[10px] block">Logs Analyzed</span>
                  <span className="font-bold text-purple-300">{prediction.totalCatchesAnalyzed} catches</span>
                </div>
              </div>

              {prediction.totalCatchesAnalyzed === 0 && (
                <div className="flex items-center gap-2 p-2 bg-sky-950/40 rounded-lg border border-sky-800/50 text-[11px] text-sky-300">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>Displaying solunar & tidal prediction model. As you log catches, the system dynamically cross-references your personal patterns.</span>
                </div>
              )}
            </div>
          )}

          {/* Prime Time Windows */}
          {(activeTab === 'all' || activeTab === 'windows') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Today's Recommended Attack Windows</span>
                </h3>
                <span className="text-[10px] text-slate-400">
                  Tidal Velocity & Twilight Sync
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {prediction.recommendedTimeWindows.map((tw, idx) => {
                  const isActiveNow = isTimeWindowActiveNow(tw);
                  const isHighest = tw.intensity === 'highest';
                  
                  return (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-xl border transition-all space-y-2 ${
                        isActiveNow 
                          ? 'bg-gradient-to-br from-emerald-950/90 to-slate-900 border-emerald-500 shadow-lg shadow-emerald-950/60 ring-1 ring-emerald-500/50' 
                          : isHighest
                            ? 'bg-slate-950/90 border-amber-800/60 hover:border-amber-700'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Top row: Title + Time Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-white leading-tight break-words">
                              {tw.title}
                            </span>
                            {isActiveNow && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse shadow-sm shadow-rose-900/60 whitespace-nowrap shrink-0">
                                <Flame className="w-3 h-3" />
                                NOW
                              </span>
                            )}
                            {isHighest && !isActiveNow && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 whitespace-nowrap shrink-0">
                                ★ Prime Target
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0">
                          <span className="font-mono text-xs font-bold text-emerald-300 px-2 py-1 bg-emerald-950/90 rounded-lg border border-emerald-800/60 shadow-inner flex items-center gap-1 whitespace-nowrap shrink-0">
                            <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>{tw.time}</span>
                          </span>
                        </div>
                      </div>

                      {/* Reason Description */}
                      <p className="text-[11px] text-slate-300 leading-snug break-words">
                        {tw.reason}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tactical Advice List */}
          {(activeTab === 'all' || activeTab === 'tactics') && (
            <div className="p-3.5 sm:p-4 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span>Data-Driven Tactical Insights</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">
                  {prediction.tacticalAdvices.length} Key Points
                </span>
              </div>

              <div className="space-y-2">
                {prediction.tacticalAdvices.map((advice, idx) => (
                  <div 
                    key={idx} 
                    className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800/80 flex items-start gap-2.5"
                  >
                    <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-800 text-sky-300 border border-slate-700 whitespace-nowrap shrink-0">
                          {advice.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed break-words">
                        {advice.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historical Stats Section */}
          {(activeTab === 'all' || activeTab === 'stats') && (
            <div className="space-y-3.5">
              
              <div className="flex items-center justify-between pt-1">
                <h3 className="text-xs sm:text-sm font-bold text-purple-300 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4" />
                  <span>Historical Analytics & Trends</span>
                </h3>
                <span className="text-[10px] text-slate-400">
                  {prediction.summary}
                </span>
              </div>

              {/* Grid 2-col for Time of Day & Tide Phase */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                
                {/* Time of Day Slots */}
                <div className="p-3.5 sm:p-4 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2.5">
                  <h4 className="font-bold text-slate-200 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-sky-400" />
                      <span>Hit Volume by Time of Day</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Ranked by Volume
                    </span>
                  </h4>

                  <div className="space-y-2">
                    {prediction.bestTimeSlots.map((ts, idx) => {
                      const isTop = ts.percentage > 0 && idx === 0;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-[11px] items-center">
                            <span className="text-slate-300 flex items-center gap-1">
                              {ts.slot.includes('Dawn') && '🌅'}
                              {ts.slot.includes('Daytime') && '☀️'}
                              {ts.slot.includes('Dusk') && '🌇'}
                              {ts.slot.includes('Night') && '🌙'}
                              <span>{ts.slot}</span>
                            </span>
                            <span className="font-mono font-bold text-white flex items-center gap-1">
                              {isTop && (
                                <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/30">
                                  Top
                                </span>
                              )}
                              <span>{ts.percentage}%</span>
                              <span className="text-[10px] text-slate-400 font-normal">({ts.count})</span>
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-800/90 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isTop ? 'bg-gradient-to-r from-sky-400 to-indigo-500' : 'bg-sky-500/80'
                              }`}
                              style={{ width: `${Math.max(ts.percentage, ts.count > 0 ? 5 : 0)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tide Phase Analysis */}
                <div className="p-3.5 sm:p-4 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2.5">
                  <h4 className="font-bold text-slate-200 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <Waves className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Hit Volume by Tidal Phase</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Flow Stage Breakdown
                    </span>
                  </h4>

                  <div className="space-y-2">
                    {prediction.tidePhaseStats.map((tp, idx) => {
                      const isTop = tp.percentage > 0 && idx === 0;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-[11px] items-center">
                            <span className="text-slate-300 truncate max-w-[170px]">{tp.phase}</span>
                            <span className="font-mono font-bold text-white flex items-center gap-1">
                              {isTop && (
                                <span className="text-[9px] font-bold text-cyan-300 bg-cyan-500/10 px-1 py-0.2 rounded border border-cyan-500/30">
                                  Lead
                                </span>
                              )}
                              <span>{tp.percentage}%</span>
                              <span className="text-[10px] text-slate-400 font-normal">({tp.count})</span>
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-800/90 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isTop ? 'bg-gradient-to-r from-cyan-400 to-teal-400' : 'bg-cyan-500/80'
                              }`}
                              style={{ width: `${Math.max(tp.percentage, tp.count > 0 ? 5 : 0)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Wind Direction Hits */}
              {prediction.windDirectionStats.length > 0 && (
                <div className="p-3.5 sm:p-4 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2.5">
                  <h4 className="font-bold text-slate-200 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-teal-400" />
                      <span>Catches by Wind Direction</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Most Favorable Wind Angles
                    </span>
                  </h4>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {prediction.windDirectionStats.map((wd, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-1.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center gap-2 text-xs"
                      >
                        <span className="font-bold text-teal-300">{wd.direction} Wind</span>
                        <span className="font-mono font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                          {wd.count} logs
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Lures & Rigs */}
              {prediction.topLures.length > 0 ? (
                <div className="p-3.5 sm:p-4 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>Proven Lures & Rigs Ranking</span>
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      From historical catch logs
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {prediction.topLures.map((lure, idx) => {
                      const medalStyles = [
                        'bg-amber-500 text-slate-950 font-black shadow-amber-500/30',
                        'bg-slate-300 text-slate-950 font-black',
                        'bg-amber-700 text-white font-black',
                      ][idx] || 'bg-slate-800 text-slate-400 font-bold border border-slate-700';

                      return (
                        <div 
                          key={idx} 
                          className="p-3 bg-slate-900/90 rounded-xl border border-slate-800/80 flex items-start justify-between gap-2.5"
                        >
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex items-start gap-2">
                              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] shadow-sm mt-0.5 ${medalStyles}`}>
                                {idx + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <span className="font-bold text-white break-words leading-tight block">
                                  {lure.name}
                                </span>
                              </div>
                            </div>

                            {lure.speciesList.length > 0 && (
                              <div className="flex flex-wrap gap-1 pl-7">
                                {lure.speciesList.map((sp, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-sky-300 border border-slate-700/60 whitespace-nowrap shrink-0"
                                  >
                                    {sp}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="text-right shrink-0 space-y-1">
                            <div className="text-xs font-black font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 whitespace-nowrap shrink-0">
                              {lure.count} fish
                            </div>
                            {lure.maxSizeCm > 0 && (
                              <div className="text-[10px] font-mono text-amber-300 font-bold whitespace-nowrap">
                                Max {lure.maxSizeCm} cm
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/80 text-center space-y-1">
                  <Award className="w-5 h-5 text-slate-500 mx-auto mb-1" />
                  <p className="text-xs text-slate-400">Lure and bait rankings populate automatically as you record tackle during catch logging.</p>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Ultra-compact Footer Note */}
        <div className="py-1 px-3 border-t border-slate-800/60 bg-slate-950/90 text-center shrink-0">
          <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5 leading-none">
            <ShieldCheck className="w-3 h-3 text-sky-400 shrink-0" />
            <span className="hidden xs:inline">Prediction fidelity automatically improves as your catch log database grows</span>
            <span className="xs:hidden">Predictor fidelity improves with logs</span>
          </p>
        </div>

      </div>
    </div>
  );
};
