import React, { useState } from 'react';
import { CatchLog, FishingSpot } from '../../types/fishing';
import { useLanguage } from '../../i18n/LanguageContext';
import { 
  Fish, Plus, Search, MapPin, 
  ChevronRight, Compass 
} from 'lucide-react';
import { formatTideName, formatTideState, formatSpeciesName, formatSpotName } from '../../utils/formatI18n';

interface CatchListProps {
  catches: CatchLog[];
  spots: FishingSpot[];
  onSelectCatch: (catchLog: CatchLog) => void;
  onAddCatch: () => void;
  onSelectSpot: (spot: FishingSpot) => void;
}

export const CatchList: React.FC<CatchListProps> = ({
  catches,
  spots,
  onSelectCatch,
  onAddCatch,
}) => {
  const { formatLength, formatWeight, formatTemp } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpotFilter, setSelectedSpotFilter] = useState('all');
  const [selectedSpeciesFilter, setSelectedSpeciesFilter] = useState('all');

  // Sort spots alphabetically
  const sortedSpots = [...spots].sort((a, b) => a.name.localeCompare(b.name, 'en'));

  // Extract all unique species
  const allSpeciesSet = new Set<string>();
  let hasNoCatchLogs = false;

  catches.forEach((c) => {
    if (c.isNoCatch || c.species === 'No Catch Logged' || c.species === '釣果なし') {
      hasNoCatchLogs = true;
      return;
    }
    if (c.items && c.items.length > 0) {
      c.items.forEach((item) => {
        if (item.species) allSpeciesSet.add(item.species);
      });
    } else if (c.species) {
      c.species.split(/[,・]/).forEach((sp) => {
        const trimmed = sp.trim();
        if (trimmed && trimmed !== 'No Catch Logged' && trimmed !== '釣果なし') allSpeciesSet.add(trimmed);
      });
    }
  });

  const allSpecies = Array.from(allSpeciesSet).sort();

  const filteredCatches = catches.filter((c) => {
    if (selectedSpotFilter !== 'all' && c.spotId !== selectedSpotFilter) return false;
    
    if (selectedSpeciesFilter === '__no_catch__') {
      if (!c.isNoCatch && c.species !== 'No Catch Logged' && c.species !== '釣果なし') return false;
    } else if (selectedSpeciesFilter !== 'all') {
      if (c.isNoCatch || c.species === 'No Catch Logged' || c.species === '釣果なし') return false;
      const matchInItems = c.items?.some((i) => i.species === selectedSpeciesFilter);
      const matchInSpecies = c.species?.includes(selectedSpeciesFilter);
      if (!matchInItems && !matchInSpecies) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSpecies = (c.species || '').toLowerCase().includes(q) ||
        (c.items || []).some((i) => i.species.toLowerCase().includes(q) || (i.lureOrBait || '').toLowerCase().includes(q));
      const matchSpot = (c.spotName || '').toLowerCase().includes(q);
      const matchLure = (c.lureOrBait || '').toLowerCase().includes(q);
      const matchNotes = (c.notes || '').toLowerCase().includes(q);
      if (!matchSpecies && !matchSpot && !matchLure && !matchNotes) return false;
    }
    return true;
  });

  const totalFishCount = filteredCatches.reduce((sum, c) => sum + (c.isNoCatch ? 0 : (c.quantity || 1)), 0);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-950 text-slate-100">
      
      {/* Top Filter & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 bg-slate-900/60 p-3 sm:p-4 rounded-2xl border border-slate-800">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search species, spots, lures, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Spot filter */}
          <select
            value={selectedSpotFilter}
            onChange={(e) => setSelectedSpotFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 sm:px-3 py-2 focus:outline-none focus:border-sky-500 max-w-[140px] sm:max-w-[160px] truncate"
          >
            <option value="all">All Spots</option>
            {sortedSpots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Species filter */}
          <select
            value={selectedSpeciesFilter}
            onChange={(e) => setSelectedSpeciesFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 sm:px-3 py-2 focus:outline-none focus:border-sky-500 max-w-[130px] sm:max-w-[150px] truncate"
          >
            <option value="all">All Species</option>
            {hasNoCatchLogs && <option value="__no_catch__">🚫 No Catch (Skunked)</option>}
            {allSpecies.map((sp) => (
              <option key={sp} value={sp}>
                {sp}
              </option>
            ))}
          </select>

          {/* Add Catch CTA */}
          <button
            onClick={onAddCatch}
            className="flex items-center gap-1 px-3 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-950 transition-all whitespace-nowrap shrink-0"
            title="Log Catch"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Log Catch</span>
          </button>
        </div>

      </div>

      {/* Stats summary banner */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1 whitespace-nowrap overflow-hidden">
        <div className="truncate">
          Catch Records: <span className="font-mono text-white font-bold">{filteredCatches.length}</span> outings 
          <span className="mx-1.5 text-slate-600">|</span>
          Total <span className="font-mono text-sky-400 font-bold">{totalFishCount}</span> fish
        </div>
      </div>

      {/* Catch Logs List */}
      {filteredCatches.length > 0 ? (
        <div className="space-y-3">
          {filteredCatches.map((c) => {
            const hasPhotos = c.photoIds && c.photoIds.length > 0;
            return (
              <div
                key={c.id}
                onClick={() => onSelectCatch(c)}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl cursor-pointer transition-all duration-200 shadow-md hover:shadow-xl gap-3"
              >
                {/* Left Fish Info */}
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  {c.isNoCatch ? (
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400 shrink-0">
                      <Compass className="w-5 h-5 sm:w-6 sm:h-6 opacity-80" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0 group-hover:scale-105 transition-transform">
                      <Fish className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    {c.isNoCatch ? (
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                        <span className="text-sm sm:text-base font-bold text-slate-300 whitespace-nowrap">
                          No Catch (Skunked)
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap shrink-0">
                          Scouting / Exploration
                        </span>
                        <span className="font-mono text-xs text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded whitespace-nowrap shrink-0">
                          0 fish
                        </span>
                      </div>
                    ) : c.items && c.items.length > 1 ? (
                      <div className="flex flex-wrap items-center gap-1.5 mb-1 min-w-0">
                        {c.items.map((item, idx) => (
                          <span
                            key={item.id || idx}
                            className="inline-flex items-center gap-1 bg-slate-800/90 text-xs px-2 py-0.5 rounded-md border border-slate-700/80 whitespace-nowrap"
                          >
                            <span className="font-bold text-white truncate max-w-[120px]">{formatSpeciesName(item.species)}</span>
                            {item.sizeCm ? (
                              <span className="font-mono text-sky-400 font-bold text-[11px] shrink-0">
                                {formatLength(item.sizeCm)}
                              </span>
                            ) : null}
                            <span className="font-mono text-slate-400 text-[11px] shrink-0">
                              {item.quantity || 1} fish
                            </span>
                          </span>
                        ))}
                        <span className="font-mono text-xs font-bold text-sky-300 bg-sky-950/80 border border-sky-800/80 px-2 py-0.5 rounded-md whitespace-nowrap shrink-0">
                          Total: {c.quantity} fish
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1 min-w-0">
                        <span className="text-sm sm:text-base font-bold text-white group-hover:text-sky-300 transition-colors truncate max-w-[180px] sm:max-w-none">
                          {formatSpeciesName(c.species)}
                        </span>
                        {(c.isSample || c.id.startsWith('catch-00')) && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-600/60 whitespace-nowrap shrink-0">
                            🔰 SAMPLE
                          </span>
                        )}
                        {c.sizeCm ? (
                          <span className="font-mono font-bold text-sky-400 text-xs sm:text-sm bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/60 whitespace-nowrap shrink-0">
                            {formatLength(c.sizeCm)}
                          </span>
                        ) : null}
                        <span className="font-mono text-xs text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded whitespace-nowrap shrink-0">
                          {c.quantity} fish
                        </span>
                        {c.weightGrams ? (
                          <span className="font-mono text-xs text-slate-400 whitespace-nowrap shrink-0">
                            {formatWeight(c.weightGrams)}
                          </span>
                        ) : null}
                      </div>
                    )}

                    {/* Spot & Date & Tide */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-slate-400 min-w-0">
                      <span className="flex items-center gap-1 text-slate-300 truncate max-w-[130px] sm:max-w-[200px]">
                        <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
                        <span className="truncate">{formatSpotName(c.spotName)}</span>
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="font-mono whitespace-nowrap">{c.date} {c.time}</span>
                      {c.weather?.tideName && (
                        <>
                          <span className="text-slate-600">·</span>
                          <span className="text-amber-300 font-medium whitespace-nowrap">
                            {formatTideName(c.weather.tideName)}{c.weather.tideState ? ` (${formatTideState(c.weather.tideState)})` : ''}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Lure / Action memo snippet */}
                    {c.lureOrBait && (
                      <div className="text-xs text-slate-400 mt-1 line-clamp-1 truncate">
                        <span className="text-slate-500">Lure: </span>
                        <span>{c.lureOrBait}</span>
                        {c.actionOrRange && <span className="text-slate-500"> · {c.actionOrRange}</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Meta & Arrow */}
                <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 shrink-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {hasPhotos && (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] whitespace-nowrap shrink-0">
                        📷 {c.photoIds.length}
                      </span>
                    )}
                    {c.weather?.temperature !== undefined && (
                      <span className="font-mono text-slate-400 hidden md:inline whitespace-nowrap shrink-0">
                        {formatTemp(c.weather.temperature)}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 space-y-3">
          <Fish className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No Catch Logs Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Record species, length, weights, effective lures, tide cycles, and photos to build your private fishing intelligence library.
          </p>
          <button
            onClick={onAddCatch}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-semibold shadow-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Log First Catch</span>
          </button>
        </div>
      )}

    </div>
  );
};
