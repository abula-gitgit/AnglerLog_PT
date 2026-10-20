import React from 'react';
import { FishingSpot, CatchLog } from '../../types/fishing';
import { useLanguage } from '../../i18n/LanguageContext';
import { Trophy, Fish, MapPin, Waves, Calendar, Award, TrendingUp, BarChart2, Target } from 'lucide-react';
import { formatSpeciesName, formatSpotName } from '../../utils/formatI18n';

interface TrophyDashboardProps {
  spots: FishingSpot[];
  catches: CatchLog[];
  onSelectSpot: (spot: FishingSpot) => void;
  onSelectCatch: (catchLog: CatchLog) => void;
}

export const TrophyDashboard: React.FC<TrophyDashboardProps> = ({
  spots,
  catches,
  onSelectSpot,
  onSelectCatch,
}) => {
  const { formatLength, formatWeight } = useLanguage();

  // Aggregate stats
  const totalFishCaught = catches.reduce((sum, c) => sum + (c.isNoCatch ? 0 : (c.quantity || 1)), 0);
  const totalOutings = catches.length;
  const noCatchOutings = catches.filter((c) => c.isNoCatch || c.species === 'No Catch Logged' || c.species === '釣果なし').length;

  // Spot exploration & outing statistics
  const visitedSpotIds = new Set(catches.map((c) => c.spotId).filter(Boolean));

  // Explored spots: spots with recorded catches or regular non-wishlist spots
  const exploredSpots = spots.filter((s) => !s.wishlistSpot || visitedSpotIds.has(s.id));

  // Wishlist spots: marked as wishlist/planned with no logged catches yet
  const wishlistUnvisitedSpots = spots.filter((s) => s.wishlistSpot && !visitedSpotIds.has(s.id));

  // Max size record per species
  const trophyRecords: { species: string; maxSize: number; catchLog: CatchLog }[] = [];
  const speciesMap = new Map<string, { maxSize: number; catchLog: CatchLog }>();

  catches.forEach((c) => {
    if (c.isNoCatch || c.species === 'No Catch Logged' || c.species === '釣果なし') return;

    if (c.items && c.items.length > 0) {
      c.items.forEach((item) => {
        if (!item.species) return;
        const size = item.sizeCm || 0;
        const current = speciesMap.get(item.species);
        if (!current || size > current.maxSize) {
          speciesMap.set(item.species, { maxSize: size, catchLog: c });
        }
      });
    } else if (c.species) {
      const size = c.sizeCm || 0;
      const current = speciesMap.get(c.species);
      if (!current || size > current.maxSize) {
        speciesMap.set(c.species, { maxSize: size, catchLog: c });
      }
    }
  });

  speciesMap.forEach((val, species) => {
    if (val.maxSize > 0) {
      trophyRecords.push({ species, maxSize: val.maxSize, catchLog: val.catchLog });
    }
  });

  trophyRecords.sort((a, b) => b.maxSize - a.maxSize);

  // Spot ranking
  const spotCatchCounts: Record<string, { count: number; spot: FishingSpot }> = {};
  spots.forEach((s) => {
    spotCatchCounts[s.id] = { count: 0, spot: s };
  });

  catches.forEach((c) => {
    if (c.isNoCatch || c.species === 'No Catch Logged' || c.species === '釣果なし') return;
    if (spotCatchCounts[c.spotId]) {
      spotCatchCounts[c.spotId].count += (c.quantity || 1);
    }
  });

  const sortedSpotRanking = Object.values(spotCatchCounts)
    .filter((sc) => sc.count > 0)
    .sort((a, b) => b.count - a.count);

  // Tide distribution (normalized to English)
  const tideCounts: Record<string, number> = {
    'Spring Tide': 0,
    'Mid Tide': 0,
    'Neap Tide': 0,
    'Transition Tide': 0,
  };

  catches.forEach((c) => {
    if (c.isNoCatch || c.species === 'No Catch Logged' || c.species === '釣果なし') return;
    const t = c.weather?.tideName;
    if (!t) return;
    if (t === 'Spring Tide' || t === '大潮') tideCounts['Spring Tide'] += (c.quantity || 1);
    else if (t === 'Mid Tide' || t === '中潮') tideCounts['Mid Tide'] += (c.quantity || 1);
    else if (t === 'Neap Tide' || t === '小潮') tideCounts['Neap Tide'] += (c.quantity || 1);
    else tideCounts['Transition Tide'] += (c.quantity || 1);
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-950 text-slate-100">
      
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 truncate">
            <Fish className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="truncate">Total Landed</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums whitespace-nowrap">
            {totalFishCaught} <span className="text-sm font-sans font-normal text-slate-400">fish</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 truncate">
            <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">Total Outings</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums whitespace-nowrap">
            {totalOutings} <span className="text-sm font-sans font-normal text-slate-400">trips</span>
          </div>
          {noCatchOutings > 0 && (
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 font-medium whitespace-nowrap truncate">
              <span className="text-emerald-400 whitespace-nowrap">Hooked {totalOutings - noCatchOutings}</span>
              <span className="text-slate-600">/</span>
              <span className="text-amber-400 whitespace-nowrap">Skunked {noCatchOutings}</span>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 truncate">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">Explored Spots</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums whitespace-nowrap">
            {exploredSpots.length} <span className="text-sm font-sans font-normal text-slate-400">spots</span>
          </div>
          {wishlistUnvisitedSpots.length > 0 ? (
            <div className="text-[11px] text-purple-400 mt-1 flex items-center gap-1 font-medium truncate whitespace-nowrap" title={`Wishlist Spots: ${wishlistUnvisitedSpots.length}`}>
              <Target className="w-3 h-3 shrink-0" />
              <span className="truncate">Wishlist: {wishlistUnvisitedSpots.length} pending</span>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 mt-1 truncate whitespace-nowrap">
              All spots explored
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 truncate">
            <Award className="w-4 h-4 text-yellow-400 shrink-0" />
            <span className="truncate">Species Logged</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums whitespace-nowrap">
            {speciesMap.size} <span className="text-sm font-sans font-normal text-slate-400">species</span>
          </div>
        </div>
      </div>

      {/* Trophy Fish Board (Max Size by Species) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
            <h3 className="text-base font-bold text-white truncate">Personal Best Trophy Board</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono whitespace-nowrap shrink-0 hidden sm:inline">(All-Time Record Catches by Species)</span>
        </div>

        {trophyRecords.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {trophyRecords.map((t, idx) => (
              <div
                key={t.species}
                onClick={() => onSelectCatch(t.catchLog)}
                className="flex items-center justify-between p-3.5 bg-slate-950/70 hover:bg-slate-800/80 rounded-xl border border-slate-800/80 cursor-pointer transition-colors gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0 whitespace-nowrap">
                    {idx === 0 ? '👑' : `#${idx + 1}`}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate max-w-[130px] sm:max-w-[160px] whitespace-nowrap">{formatSpeciesName(t.species)}</h4>
                    <p className="text-[11px] text-slate-400 truncate whitespace-nowrap">
                      📍 {formatSpotName(t.catchLog.spotName)} · {t.catchLog.date}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-lg font-bold font-mono text-sky-400 tabular-nums whitespace-nowrap">
                    {formatLength(t.maxSize)}
                  </div>
                  {t.catchLog.weightGrams ? (
                    <div className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                      {formatWeight(t.catchLog.weightGrams)}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500">
            No catches with length measurements recorded yet.
          </div>
        )}
      </div>

      {/* Spot Ranking & Tide Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Top Productive Spots */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-sky-400 shrink-0" />
            <h3 className="text-base font-bold text-white">Top Productive Spots</h3>
          </div>

          {sortedSpotRanking.length > 0 ? (
            <div className="space-y-2.5">
              {sortedSpotRanking.slice(0, 5).map((item, idx) => {
                const percentage = Math.round((item.count / (totalFishCaught || 1)) * 100);
                return (
                  <div
                    key={item.spot.id}
                    onClick={() => onSelectSpot(item.spot)}
                    className="p-3 bg-slate-950/60 hover:bg-slate-800/60 rounded-xl border border-slate-800/80 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                      <span className="font-semibold text-white truncate max-w-[200px] whitespace-nowrap">
                        {idx + 1}. {formatSpotName(item.spot.name)}
                      </span>
                      <span className="font-mono text-sky-400 font-bold whitespace-nowrap shrink-0">
                        {item.count} fish ({percentage}%)
                      </span>
                    </div>
                    {/* Bar */}
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-sky-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500">
              Spot productivity ranking will generate automatically as catch records are added.
            </div>
          )}
        </div>

        {/* Tide Distribution Analysis */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-sky-400 shrink-0" />
            <h3 className="text-base font-bold text-white">Catch Distribution by Tide Stage</h3>
          </div>

          <div className="space-y-2.5">
            {Object.entries(tideCounts).map(([tide, count]) => {
              const maxVal = Math.max(...Object.values(tideCounts), 1);
              const percentage = Math.round((count / maxVal) * 100);

              return (
                <div key={tide} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                    <span className="font-semibold text-slate-300 whitespace-nowrap">{tide}</span>
                    <span className="font-mono text-sky-400 font-bold whitespace-nowrap">{count} fish</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Wishlist Spots */}
      {wishlistUnvisitedSpots.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-white">Target Wishlist Spots</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Planned or unvisited scouting spots (automatically promoted once your first catch is logged)
                </p>
              </div>
            </div>
            <span className="text-xs text-purple-300 font-mono font-bold bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-800/60 self-start sm:self-auto shrink-0 whitespace-nowrap">
              {wishlistUnvisitedSpots.length} spots
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {wishlistUnvisitedSpots.map((spot) => (
              <div
                key={spot.id}
                onClick={() => onSelectSpot(spot)}
                className="p-3.5 bg-slate-950/70 hover:bg-slate-800/80 rounded-xl border border-purple-900/40 hover:border-purple-600/60 cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <span className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors truncate whitespace-nowrap min-w-0 flex-1">
                    {spot.name}
                  </span>
                  {spot.planDate ? (
                    <span className="shrink-0 text-[10px] font-mono font-semibold bg-purple-900/60 text-purple-200 border border-purple-700/50 px-1.5 py-0.5 rounded whitespace-nowrap">
                      📅 {spot.planDate.slice(5)}
                    </span>
                  ) : (
                    <span className="shrink-0 text-[10px] font-semibold bg-purple-950 text-purple-300 border border-purple-800/50 px-1.5 py-0.5 rounded whitespace-nowrap">
                      🎯 Wishlist
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {spot.planNotes || spot.description || 'No plan notes entered'}
                </div>

                {spot.targetSpecies && spot.targetSpecies.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {spot.targetSpecies.slice(0, 3).map((sp) => (
                      <span key={sp} className="text-[10px] bg-slate-900 text-sky-300 px-1.5 py-0.5 rounded border border-slate-800 whitespace-nowrap shrink-0">
                        {sp}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
