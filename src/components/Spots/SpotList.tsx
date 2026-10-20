import React, { useState } from 'react';
import { FishingSpot, CatchLog, SpotType } from '../../types/fishing';
import { DeleteConfirmModal } from '../Common/DeleteConfirmModal';
import { 
  MapPin, Star, Plus, Search, Filter, Fish, Waves, Compass, 
  Car, ShieldAlert, ArrowRight, ExternalLink, Ban, Target, Calendar, Trash2
} from 'lucide-react';
import { formatBottomType, formatSpotType, formatSpeciesName, formatSpotName } from '../../utils/formatI18n';

interface SpotListProps {
  spots: FishingSpot[];
  catches: CatchLog[];
  onSelectSpot: (spot: FishingSpot) => void;
  onAddSpot: () => void;
  onAddCatch: (spot: FishingSpot) => void;
  onShowOnMap: (spot: FishingSpot) => void;
  onDeleteSpot?: (spotId: string) => void;
  onSwitchToMap?: () => void;
}

const SPOT_TYPE_LABELS: Record<SpotType, string> = {
  breakwater: 'Breakwater / Jetty',
  rocky: 'Rocky Shore / Reef',
  surf: 'Surf / Beach',
  estuary: 'Estuary / River',
  lake_pond: 'Lake / Pond',
  port: 'Fishing Port / Marina',
  boat: 'Offshore / Boat',
  stream: 'Stream / Creek',
  unknown: 'Unknown'
};

export const SpotList: React.FC<SpotListProps> = ({
  spots,
  catches,
  onSelectSpot,
  onAddSpot,
  onAddCatch,
  onShowOnMap,
  onDeleteSpot,
  onSwitchToMap,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'normal' | 'wishlist' | 'avoid'>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'catches' | 'rating' | 'name'>('date');
  const [spotToDelete, setSpotToDelete] = useState<FishingSpot | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter & Sort
  const filteredSpots = spots
    .filter((spot) => {
      if (favoritesOnly && !spot.favorite) return false;
      if (statusFilter === 'normal' && (spot.avoidSpot || spot.wishlistSpot)) return false;
      if (statusFilter === 'wishlist' && !spot.wishlistSpot) return false;
      if (statusFilter === 'avoid' && !spot.avoidSpot) return false;
      if (typeFilter !== 'all' && spot.spotType !== typeFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = spot.name.toLowerCase().includes(query);
        const matchDesc = (spot.description || '').toLowerCase().includes(query);
        const matchSpecies = (spot.targetSpecies || []).some((s) => s.toLowerCase().includes(query));
        const matchBottom = (spot.bottomType || []).some((b) => b.toLowerCase().includes(query));
        const matchAvoidReason = (spot.avoidReason || '').toLowerCase().includes(query);
        const matchAvoidTags = (spot.avoidTags || []).some((t) => t.toLowerCase().includes(query));
        const matchWishlistNotes = (spot.planNotes || '').toLowerCase().includes(query);
        const matchWishlistTags = (spot.wishlistTags || []).some((t) => t.toLowerCase().includes(query));
        if (
          !matchName && 
          !matchDesc && 
          !matchSpecies && 
          !matchBottom && 
          !matchAvoidReason && 
          !matchAvoidTags && 
          !matchWishlistNotes && 
          !matchWishlistTags
        ) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'en');
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'catches') {
        const catchCountA = catches.filter((c) => c.spotId === a.id).reduce((sum, c) => sum + (c.isNoCatch ? 0 : (c.quantity || 1)), 0);
        const catchCountB = catches.filter((c) => c.spotId === b.id).reduce((sum, c) => sum + (c.isNoCatch ? 0 : (c.quantity || 1)), 0);
        return catchCountB - catchCountA;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-950 text-slate-100">
      
      {/* Top Filter & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 sm:p-4 rounded-2xl border border-slate-800">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by spot name, species, bottom type, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Spots ({spots.length})</option>
            <option value="wishlist">🎯 Wishlist / Planned ({spots.filter((s) => s.wishlistSpot).length})</option>
            <option value="normal">Active / Regular Spots ({spots.filter((s) => !s.avoidSpot && !s.wishlistSpot).length})</option>
            <option value="avoid">⛔ Avoid / Blacklisted ({spots.filter((s) => s.avoidSpot).length})</option>
          </select>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Types</option>
            {Object.entries(SPOT_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500"
          >
            <option value="date">Date Added</option>
            <option value="catches">Total Catches</option>
            <option value="rating">Rating</option>
            <option value="name">Name (A-Z)</option>
          </select>

          {/* Favorites toggle */}
          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`flex items-center gap-1 text-xs px-3 py-2 rounded-xl border transition-colors ${
              favoritesOnly
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-amber-400' : ''}`} />
            <span>Favorites</span>
          </button>

          {/* Add spot CTA */}
          <button
            onClick={onAddSpot}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-xl shadow-md shadow-sky-950 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Spot</span>
          </button>
        </div>

      </div>

      {/* Spot Count Banner */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div>
          Fishing Spots: <span className="font-mono text-white font-bold">{filteredSpots.length}</span>
          {spots.length !== filteredSpots.length && ` (of ${spots.length} total)`}
        </div>
      </div>

      {/* Spot Cards Grid */}
      {filteredSpots.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSpots.map((spot) => {
            const spotCatches = catches.filter((c) => c.spotId === spot.id);
            const totalCatchQty = spotCatches.reduce((acc, c) => acc + (c.isNoCatch ? 0 : (c.quantity || 1)), 0);

            return (
              <div
                key={spot.id}
                className={`group flex flex-col justify-between rounded-2xl p-4 transition-all duration-200 shadow-lg hover:shadow-xl ${
                  spot.avoidSpot
                    ? 'bg-slate-900 border-2 border-rose-900/80 hover:border-rose-600/80 shadow-rose-950/20'
                    : spot.wishlistSpot
                    ? 'bg-slate-900 border-2 border-purple-800/80 hover:border-purple-500/80 shadow-purple-950/20'
                    : 'bg-slate-900 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top Meta */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/30 whitespace-nowrap shrink-0">
                        {SPOT_TYPE_LABELS[spot.spotType] || formatSpotType(spot.spotType)}
                      </span>
                      {(spot.isSample || spot.id.startsWith('spot-florida') || spot.id.startsWith('spot-san-diego') || spot.id.startsWith('spot-lake-fork')) && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/90 px-1.5 py-0.5 rounded border border-amber-600/60 whitespace-nowrap shrink-0">
                          <span>🔰 SAMPLE</span>
                        </span>
                      )}
                      {spot.favorite && (
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                      )}
                      {spot.wishlistSpot && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-purple-300 bg-purple-950/90 px-1.5 py-0.5 rounded border border-purple-600/60 whitespace-nowrap shrink-0">
                          <Target className="w-3 h-3 shrink-0" />
                          <span>{spot.planDate ? `📅 ${spot.planDate}` : '🎯 Wishlist'}</span>
                        </span>
                      )}
                      {spot.avoidSpot && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-950/90 px-1.5 py-0.5 rounded border border-rose-700/60 whitespace-nowrap shrink-0">
                          <Ban className="w-3 h-3 shrink-0" /> Avoid (NG)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400 font-mono whitespace-nowrap shrink-0 ml-1">
                      <Fish className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="text-white font-bold">{totalCatchQty}</span>
                      <span>catches</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 
                    onClick={() => onSelectSpot(spot)}
                    className={`text-base font-bold cursor-pointer transition-colors leading-snug line-clamp-1 mb-2 ${
                      spot.avoidSpot
                        ? 'text-slate-200 group-hover:text-rose-400'
                        : spot.wishlistSpot
                        ? 'text-white group-hover:text-purple-300'
                        : 'text-white group-hover:text-sky-300'
                    }`}
                  >
                    {formatSpotName(spot.name)}
                  </h3>

                  {/* Coordinates & Location */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono mb-3">
                    <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
                    <span>{spot.lat.toFixed(4)}°, {spot.lng.toFixed(4)}°</span>
                  </div>

                  {/* Wishlist / Plan note */}
                  {spot.wishlistSpot && (
                    <div className="bg-purple-950/30 border border-purple-600/40 rounded-xl p-2.5 mb-3 text-xs">
                      <div className="flex items-center gap-1 font-bold text-purple-300 text-[11px] mb-1">
                        <Target className="w-3 h-3 shrink-0 text-purple-400" />
                        <span>{spot.planDate ? `📅 ${spot.planDate} Trip Plan` : '🎯 Wishlist Target'}</span>
                      </div>
                      {spot.wishlistTags && spot.wishlistTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {spot.wishlistTags.map((tag, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/80 text-purple-200 border border-purple-700/50"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {spot.planNotes && (
                        <p className="text-[11px] text-purple-200 line-clamp-2 leading-relaxed">
                          {spot.planNotes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Avoid spot warning note */}
                  {spot.avoidSpot && (
                    <div className="bg-rose-950/40 border border-rose-600/40 rounded-xl p-2.5 mb-3 text-xs">
                      <div className="flex items-center gap-1 font-bold text-rose-400 text-[11px] mb-1">
                        <Ban className="w-3 h-3 shrink-0" />
                        <span>Avoid Reason / Notes</span>
                      </div>
                      {spot.avoidTags && spot.avoidTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {spot.avoidTags.map((tag, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-rose-900/80 text-rose-200 border border-rose-700/50"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {spot.avoidReason && (
                        <p className="text-[11px] text-rose-300 line-clamp-2 leading-relaxed">
                          {spot.avoidReason}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Depth & Bottom info */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 mb-3">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Depth</span>
                      <span className="text-slate-200 text-xs font-medium truncate block">
                        {spot.waterDepth || 'Not recorded'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Bottom</span>
                      <span className="text-slate-200 text-xs font-medium truncate block">
                        {spot.bottomType && spot.bottomType.length > 0 ? spot.bottomType.map(formatBottomType).join(', ') : 'Not specified'}
                      </span>
                    </div>
                  </div>

                  {/* Description preview */}
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {spot.description || spot.hazardAndAccessNotes || 'No notes registered yet.'}
                  </p>

                  {/* Target Species tags */}
                  {spot.targetSpecies && spot.targetSpecies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {spot.targetSpecies.slice(0, 4).map((sp, idx) => (
                        <span key={idx} className="text-[11px] px-2 py-0.5 bg-slate-800/80 text-sky-300 rounded">
                          {formatSpeciesName(sp)}
                        </span>
                      ))}
                      {spot.targetSpecies.length > 4 && (
                        <span className="text-[10px] px-1.5 py-0.5 text-slate-500">
                          +{spot.targetSpecies.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Bottom Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onShowOnMap(spot)}
                      className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-lg text-xs transition-colors flex items-center gap-1"
                      title="View on Map"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Map</span>
                    </button>
                    <button
                      onClick={() => onAddCatch(spot)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
                      title="Log Catch"
                    >
                      + Catch
                    </button>
                    {onDeleteSpot && (
                      <button
                        onClick={() => setSpotToDelete(spot)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg text-xs transition-colors"
                        title="Delete Spot"
                        aria-label="Delete Spot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectSpot(spot)}
                    className="flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    <span>Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 space-y-3">
          <MapPin className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No matching fishing spots found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search filters, or click "Add Spot" to drop a pin using GPS or coordinates.
          </p>
          <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
            <button
              onClick={onAddSpot}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-semibold shadow-md transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Spot</span>
            </button>
            {onSwitchToMap && (
              <button
                onClick={onSwitchToMap}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
              >
                <MapPin className="w-4 h-4 text-sky-400" />
                <span>Pin on Map View</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Delete Spot Modal */}
      {spotToDelete && onDeleteSpot && (
        <DeleteConfirmModal
          isOpen={!!spotToDelete}
          title={`Delete "${spotToDelete.name}"?`}
          message="Are you sure you want to delete this fishing spot? This action cannot be undone."
          subMessage="Note: Catch logs previously logged at this spot will remain preserved."
          confirmLabel="Delete Spot"
          cancelLabel="Cancel"
          isDeleting={isDeleting}
          onConfirm={async () => {
            setIsDeleting(true);
            try {
              await onDeleteSpot(spotToDelete.id);
              setSpotToDelete(null);
            } finally {
              setIsDeleting(false);
            }
          }}
          onCancel={() => setSpotToDelete(null)}
        />
      )}

    </div>
  );
};
