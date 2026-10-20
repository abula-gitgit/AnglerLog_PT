import React, { useState } from 'react';
import { FishingSpot, SpotType, SnagRisk } from '../../types/fishing';
import { saveSpot } from '../../services/db';
import { processAndAutoSavePhoto } from '../../services/photoStorage';
import { DeleteConfirmModal } from '../Common/DeleteConfirmModal';
import { SpotLocationPicker } from './SpotLocationPicker';
import { 
  X, MapPin, Save, Camera, Plus, Trash2, AlertCircle, Waves, 
  Compass, Car, ShieldAlert, Star, Ban, AlertTriangle, Target, Calendar, Sparkles
} from 'lucide-react';

interface SpotEditModalProps {
  initialSpot?: Partial<FishingSpot> | null;
  onClose: () => void;
  onSaved: (spot: FishingSpot) => void;
  onDelete?: (spotId: string) => void;
}

const SPOT_TYPES: { value: SpotType; label: string }[] = [
  { value: 'breakwater', label: 'Breakwater / Jetty' },
  { value: 'rocky', label: 'Rocky Shore / Reef' },
  { value: 'surf', label: 'Surf / Sandy Beach' },
  { value: 'estuary', label: 'Estuary / River / Canal' },
  { value: 'lake_pond', label: 'Lake / Pond / Reservoir' },
  { value: 'port', label: 'Harbor / Marina' },
  { value: 'boat', label: 'Offshore / Boat' },
  { value: 'stream', label: 'Stream / Creek' },
  { value: 'unknown', label: 'Unknown / Other' },
];

const COMMON_BOTTOM_TYPES = [
  'Sand', 'Rock / Reef', 'Tetrapod / Structure', 'Seagrass / Kelp', 
  'Mud / Silt', 'Riprap / Gravel', 'Concrete Wall', 'Oyster Bed'
];

const COMMON_SPECIES = [
  'Striped Bass', 'Largemouth Bass', 'Trout', 'Redfish', 
  'Flounder', 'Snook', 'Bluefish', 'Walleye', 'Crappie', 'Catfish'
];

const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];
const TIMES_OF_DAY = ['Morning Dawn', 'Evening Dusk', 'Daytime', 'Night'];

export const AVOID_REASON_PRESETS = [
  '🚫 Fishing Prohibited / No Trespassing',
  '🚨 Parking Trouble / Enforcement',
  '🪨 Heavy Snags / Rig Loss',
  '⚠️ Hazard (Unstable Footing / Heavy Surge)',
  '🎣 Poor Fish Activity / Heavy Silt / Too Shallow',
  '👥 Overcrowded / Bad Etiquette',
  '🧗 Tough Access (Steep Cliff / Heavy Bushwhacking)',
  '⚠️ Strict Local Regulations / Private Property',
];

export const WISHLIST_PRESETS = [
  '🎯 Renowned Destination on Bucket List',
  '🌊 Hot Bite / Trending Local Reports',
  '🐟 Trophy / Trophy Fish Records',
  '🗺️ New Exploration Ground',
  '🚗 Travel / Road Trip Candidate',
  '🌙 Night Fishing / Dawn Scouting',
  '🎣 Planned Trip with Friends',
  '🛶 Kayak / Boat Launch Spot',
];

export const SpotEditModal: React.FC<SpotEditModalProps> = ({
  initialSpot,
  onClose,
  onSaved,
  onDelete,
}) => {
  const isEdit = !!initialSpot?.id;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [name, setName] = useState(initialSpot?.name || '');
  const [spotType, setSpotType] = useState<SpotType>(initialSpot?.spotType || 'breakwater');
  const [lat, setLat] = useState<number>(initialSpot?.lat || 35.1328);
  const [lng, setLng] = useState<number>(initialSpot?.lng || 139.6135);
  const [description, setDescription] = useState(initialSpot?.description || '');
  const [waterDepth, setWaterDepth] = useState(initialSpot?.waterDepth || '');
  const [bottomType, setBottomType] = useState<string[]>(initialSpot?.bottomType || []);
  const [snagRisk, setSnagRisk] = useState<SnagRisk>(initialSpot?.snagRisk || 'unknown');
  const [currentNotes, setCurrentNotes] = useState(initialSpot?.currentNotes || '');
  const [parkingInfo, setParkingInfo] = useState(initialSpot?.parkingInfo || '');
  const [hazardAndAccessNotes, setHazardAndAccessNotes] = useState(initialSpot?.hazardAndAccessNotes || '');
  const [bestSeasons, setBestSeasons] = useState<string[]>(initialSpot?.bestSeasons || ['Spring', 'Autumn']);
  const [bestTimeOfDay, setBestTimeOfDay] = useState<string[]>(initialSpot?.bestTimeOfDay || ['Morning Dawn', 'Evening Dusk']);
  const [targetSpecies, setTargetSpecies] = useState<string[]>(initialSpot?.targetSpecies || []);
  const [customSpeciesInput, setCustomSpeciesInput] = useState('');
  const [favorite, setFavorite] = useState(initialSpot?.favorite ?? false);
  const [avoidSpot, setAvoidSpot] = useState<boolean>(initialSpot?.avoidSpot ?? false);
  const [avoidReason, setAvoidReason] = useState<string>(initialSpot?.avoidReason || '');
  const [avoidTags, setAvoidTags] = useState<string[]>(initialSpot?.avoidTags || []);
  const [wishlistSpot, setWishlistSpot] = useState<boolean>(initialSpot?.wishlistSpot ?? false);
  const [planDate, setPlanDate] = useState<string>(initialSpot?.planDate || '');
  const [planNotes, setPlanNotes] = useState<string>(initialSpot?.planNotes || '');
  const [wishlistTags, setWishlistTags] = useState<string[]>(initialSpot?.wishlistTags || []);
  const [rating, setRating] = useState(initialSpot?.rating || 4);
  const [photoIds, setPhotoIds] = useState<string[]>(initialSpot?.photoIds || []);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadedPhotosPreview, setUploadedPhotosPreview] = useState<{ id: string; url: string }[]>([]);

  const handleToggleAvoidTag = (tag: string) => {
    if (avoidTags.includes(tag)) {
      setAvoidTags(avoidTags.filter((t) => t !== tag));
    } else {
      setAvoidTags([...avoidTags, tag]);
    }
  };

  const handleToggleWishlistTag = (tag: string) => {
    if (wishlistTags.includes(tag)) {
      setWishlistTags(wishlistTags.filter((t) => t !== tag));
    } else {
      setWishlistTags([...wishlistTags, tag]);
    }
  };

  const handleToggleBottom = (type: string) => {
    if (bottomType.includes(type)) {
      setBottomType(bottomType.filter((t) => t !== type));
    } else {
      setBottomType([...bottomType, type]);
    }
  };

  const handleToggleSpecies = (sp: string) => {
    if (targetSpecies.includes(sp)) {
      setTargetSpecies(targetSpecies.filter((t) => t !== sp));
    } else {
      setTargetSpecies([...targetSpecies, sp]);
    }
  };

  const handleAddCustomSpecies = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    if (!customSpeciesInput.trim()) return;
    if (!targetSpecies.includes(customSpeciesInput.trim())) {
      setTargetSpecies([...targetSpecies, customSpeciesInput.trim()]);
    }
    setCustomSpeciesInput('');
  };

  const handleToggleSeason = (season: string) => {
    if (bestSeasons.includes(season)) {
      setBestSeasons(bestSeasons.filter((s) => s !== season));
    } else {
      setBestSeasons([...bestSeasons, season]);
    }
  };

  const handleToggleTimeOfDay = (tod: string) => {
    if (bestTimeOfDay.includes(tod)) {
      setBestTimeOfDay(bestTimeOfDay.filter((t) => t !== tod));
    } else {
      setBestTimeOfDay([...bestTimeOfDay, tod]);
    }
  };

  // Immediate photo upload & auto-save to IndexedDB
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);
    try {
      const addedIds: string[] = [];
      const newPreviews: { id: string; url: string }[] = [];

      for (let i = 0; i < files.length; i++) {
        const photo = await processAndAutoSavePhoto(files[i], {
          caption: `${name || 'Spot'} Photo`
        });
        addedIds.push(photo.id);
        newPreviews.push({ id: photo.id, url: photo.dataUrl });
      }

      setPhotoIds((prev) => [...prev, ...addedIds]);
      setUploadedPhotosPreview((prev) => [...prev, ...newPreviews]);
    } catch (err) {
      console.error(err);
      alert('Failed to save spot photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a spot name.');
      return;
    }

    const spotId = initialSpot?.id || 'spot-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();

    const spotData: FishingSpot = {
      id: spotId,
      name: name.trim(),
      spotType,
      lat: Number(lat),
      lng: Number(lng),
      description: description.trim(),
      waterDepth: waterDepth.trim(),
      bottomType,
      snagRisk,
      currentNotes: currentNotes.trim(),
      parkingInfo: parkingInfo.trim(),
      hazardAndAccessNotes: hazardAndAccessNotes.trim(),
      bestSeasons,
      bestTimeOfDay,
      targetSpecies,
      favorite,
      rating,
      avoidSpot,
      avoidReason: avoidReason.trim(),
      avoidTags,
      wishlistSpot,
      planDate: planDate || undefined,
      planNotes: planNotes.trim() || undefined,
      wishlistTags,
      photoIds,
      subPoints: initialSpot?.subPoints || [],
      createdAt: initialSpot?.createdAt || now,
      updatedAt: now,
    };

    try {
      await saveSpot(spotData);
      onSaved(spotData);
    } catch (err) {
      console.error('Save spot failed:', err);
      alert('Failed to save spot information.');
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">
              {isEdit ? 'Fangplatz bearbeiten' : 'Pin New Fishing Spot'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Record spot structures, depth, bottom composition, hazards, and access notes
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* Spot Name, Favorite & Avoid Spot Buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200">
                Spot Name <span className="text-rose-400">*</span>
              </label>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const next = !favorite;
                    setFavorite(next);
                    if (next && avoidSpot) setAvoidSpot(false);
                  }}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    favorite
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-300'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 shrink-0 ${favorite ? 'fill-amber-400' : ''}`} />
                  <span>Favorite</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = !wishlistSpot;
                    setWishlistSpot(next);
                    if (next && avoidSpot) setAvoidSpot(false);
                  }}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    wishlistSpot
                      ? 'bg-purple-500/25 text-purple-300 border-purple-500 font-semibold shadow-sm shadow-purple-950'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-purple-300 hover:border-purple-800/60'
                  }`}
                  title="Mark as Wishlist / Planned Spot"
                >
                  <Target className={`w-3.5 h-3.5 shrink-0 ${wishlistSpot ? 'text-purple-400' : ''}`} />
                  <span>{wishlistSpot ? (planDate ? '📅 Trip Planned' : '🎯 Wishlist') : 'Wishlist'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = !avoidSpot;
                    setAvoidSpot(next);
                    if (next) {
                      if (favorite) setFavorite(false);
                      if (wishlistSpot) setWishlistSpot(false);
                    }
                  }}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    avoidSpot
                      ? 'bg-rose-500/25 text-rose-300 border-rose-500 font-semibold shadow-sm shadow-rose-950'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-rose-400 hover:border-rose-900/50'
                  }`}
                  title="Mark as Avoid / Do Not Return (Prohibited, Hazards, Crowded)"
                >
                  <Ban className={`w-3.5 h-3.5 shrink-0 ${avoidSpot ? 'text-rose-400' : ''}`} />
                  <span>{avoidSpot ? '⛔ Avoid Spot (NG)' : 'Avoid Spot'}</span>
                </button>
              </div>
            </div>
            <input
              type="text"
              required
              placeholder="e.g., Montauk Lighthouse Rocks / Chesapeake Bay Bridge East Piling"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Avoid / NG Warning Panel */}
          {avoidSpot && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/50 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                  <Ban className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Reason to Avoid (NG Marking)</span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-rose-300 bg-rose-900/60 px-2 py-0.5 rounded border border-rose-700/50 font-medium whitespace-nowrap shrink-0">
                  Displays with red / black avoid icon on map
                </span>
              </div>

              {/* Quick Preset Tags */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300">
                  Select applicable reasons (multiple allowed):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVOID_REASON_PRESETS.map((preset) => {
                    const isSelected = avoidTags.includes(preset);
                    return (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => handleToggleAvoidTag(preset)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                          isSelected
                            ? 'bg-rose-600 text-white shadow-sm border border-rose-400 font-semibold'
                            : 'bg-slate-900/90 text-slate-300 border border-slate-700/80 hover:border-rose-500/50 hover:text-white'
                        }`}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Reason Notes */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  Detailed Notes & Incident History:
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., Fenced off completely in 2026. Frequent parking tickets. Submerged riprap lost 3 expensive plugs in 30 minutes."
                  value={avoidReason}
                  onChange={(e) => setAvoidReason(e.target.value)}
                  className="w-full bg-slate-950 border border-rose-500/40 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          )}

          {/* Wishlist / Plan Panel */}
          {wishlistSpot && (
            <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/50 space-y-3.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                  <Target className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Wishlist & Outing Plan Notes</span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded border border-purple-700/50 font-medium">
                  Displays with purple target icon (🎯) on map
                </span>
              </div>

              {/* Date & Quick Presets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    Target Trip Date (Optional):
                  </label>
                  <input
                    type="date"
                    value={planDate}
                    onChange={(e) => setPlanDate(e.target.value)}
                    className="w-full bg-slate-950 border border-purple-500/40 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="flex items-end">
                  {planDate && (
                    <div className="text-[11px] text-purple-300 bg-purple-900/40 px-3 py-2 rounded-lg border border-purple-700/40 w-full flex items-center justify-between">
                      <span>📅 Planned: {new Date(planDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' })}</span>
                      <button
                        type="button"
                        onClick={() => setPlanDate('')}
                        className="text-xs text-purple-400 hover:text-white underline ml-2"
                      >
                        Clear Date
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Preset Tags */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300">
                  Motivation & Goals (Select multiple):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {WISHLIST_PRESETS.map((preset) => {
                    const isSelected = wishlistTags.includes(preset);
                    return (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => handleToggleWishlistTag(preset)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-sm border border-purple-400 font-semibold'
                            : 'bg-slate-900/90 text-slate-300 border border-slate-700/80 hover:border-purple-500/50 hover:text-white'
                        }`}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Plan Notes */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  Trip Planning & Tackle Prep Notes:
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., Target falling tide at dawn during spring tide. Bring medium-heavy surf rod and twitch baits. Meet up with Mark at 5:00 AM."
                  value={planNotes}
                  onChange={(e) => setPlanNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-purple-500/40 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>
          )}

          {/* Spot Type & Snag Risk */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200">Spot Environment</label>
              <select
                value={spotType}
                onChange={(e) => setSpotType(e.target.value as SpotType)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              >
                {SPOT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200">Snag Risk Level</label>
              <select
                value={snagRisk}
                onChange={(e) => setSnagRisk(e.target.value as SnagRisk)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              >
                <option value="low">Low (Clean Open Water / Sand)</option>
                <option value="medium">Medium (Scattered Rocks / Riprap)</option>
                <option value="high">High (Heavy Structure / Kelp / Submerged Debris)</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </div>

          {/* Spot Location Picker (Interactive Map, GPS, Landmark Search) */}
          <SpotLocationPicker
            lat={lat}
            lng={lng}
            onChange={({ lat: newLat, lng: newLng, suggestedName }) => {
              setLat(newLat);
              setLng(newLng);
              if (suggestedName && !name.trim()) {
                setName(suggestedName);
              }
            }}
          />

          {/* Water Depth & Bottom Composition */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5 text-sky-400" />
                <span>Water Depth & Drop-offs</span>
              </label>
              <input
                type="text"
                placeholder="e.g., 6 ft at shoreline dropping steeply to 25 ft around 40 yards out"
                value={waterDepth}
                onChange={(e) => setWaterDepth(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-sky-400" />
                <span>Bottom Composition & Structure</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_BOTTOM_TYPES.map((type) => {
                  const active = bottomType.includes(type);
                  return (
                    <button
                      type="button"
                      key={type}
                      onClick={() => handleToggleBottom(type)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        active
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Current & Tidal flow notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200">
              Current, Tidal Flow & Bite Window Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Strong rip current flows east on dropping tide. Prime bite occurs right when tide rips past the point tip."
              value={currentNotes}
              onChange={(e) => setCurrentNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Spot Description & Overview */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200">
              Spot Profile & Proven Patterns
            </label>
            <textarea
              rows={3}
              placeholder="Key structures, presentation angles, baitfish movements, productive lure colors, and seasonal trends"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Parking & Hazards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-emerald-400" />
                <span>Parking & Access Details</span>
              </label>
              <textarea
                rows={2}
                placeholder="e.g., Public gravel lot ($5 fee, 3 min walk to shore). Gate opens at sunrise."
                value={parkingInfo}
                onChange={(e) => setParkingInfo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Hazards, Safety & Restrictions</span>
              </label>
              <textarea
                rows={2}
                placeholder="e.g., Slippery algae on low rocks. Wading boots and PFD required. Watch for sudden swells on high tide."
                value={hazardAndAccessNotes}
                onChange={(e) => setHazardAndAccessNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Target Species */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200">Target Species</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_SPECIES.map((sp) => {
                const active = targetSpecies.includes(sp);
                return (
                  <button
                    type="button"
                    key={sp}
                    onClick={() => handleToggleSpecies(sp)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      active
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {sp}
                  </button>
                );
              })}
            </div>
            {/* Custom Species add */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add custom species (Press Enter)"
                value={customSpeciesInput}
                onChange={(e) => setCustomSpeciesInput(e.target.value)}
                onKeyDown={handleAddCustomSpecies}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={handleAddCustomSpecies}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-sky-400 rounded-lg font-medium"
              >
                Add
              </button>
            </div>
          </div>

          {/* Seasons & Time of day */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200">Prime Seasons</label>
              <div className="flex gap-1.5">
                {SEASONS.map((season) => (
                  <button
                    type="button"
                    key={season}
                    onClick={() => handleToggleSeason(season)}
                    className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors ${
                      bestSeasons.includes(season)
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {season}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200">Prime Time Window</label>
              <div className="flex gap-1.5">
                {TIMES_OF_DAY.map((tod) => (
                  <button
                    type="button"
                    key={tod}
                    onClick={() => handleToggleTimeOfDay(tod)}
                    className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors ${
                      bestTimeOfDay.includes(tod)
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {tod}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Photo auto-save upload section */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-sky-400" />
                <span>Spot Photos (IndexedDB Persistent)</span>
              </label>
              <label className="cursor-pointer text-xs font-medium text-sky-400 hover:text-sky-300 flex items-center gap-1">
                <span>{isUploadingPhoto ? 'Wird gespeichert...' : '+ Upload Photos'}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  disabled={isUploadingPhoto}
                  className="hidden"
                />
              </label>
            </div>
            
            {uploadedPhotosPreview.length > 0 && (
              <div className="grid grid-cols-4 gap-2 pt-1">
                {uploadedPhotosPreview.map((p) => (
                  <div key={p.id} className="relative aspect-video rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                    <img src={p.url} alt="Uploaded" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
            <p className="text-[11px] text-slate-500">
              Selected photos are saved immediately and privately to local IndexedDB.
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <div>
              {isEdit && onDelete && initialSpot?.id && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3.5 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-1.5 border border-rose-900/60"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Spot</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-xl shadow-md shadow-sky-950 flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{isEdit ? 'Save Changes' : 'Pin Fishing Spot'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>

      {/* Delete Confirmation Modal */}
      {isEdit && onDelete && initialSpot?.id && (
        <DeleteConfirmModal
          isOpen={showDeleteConfirm}
          title={`Delete "${initialSpot.name || name}"?`}
          message="Are you sure you want to delete this fishing spot? This action cannot be undone."
          subMessage="All catch logs previously recorded at this spot will be preserved."
          confirmLabel="Delete Spot"
          cancelLabel="Cancel"
          isDeleting={isDeleting}
          onConfirm={async () => {
            setIsDeleting(true);
            try {
              await onDelete(initialSpot.id!);
              onClose();
            } finally {
              setIsDeleting(false);
              setShowDeleteConfirm(false);
            }
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
};
