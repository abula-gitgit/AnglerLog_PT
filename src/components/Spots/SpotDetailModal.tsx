import React, { useState, useEffect } from 'react';
import { FishingSpot, CatchLog, StoredPhoto } from '../../types/fishing';
import { getPhotosByIds } from '../../services/db';
import { processAndAutoSavePhoto } from '../../services/photoStorage';
import { DeleteConfirmModal } from '../Common/DeleteConfirmModal';
import { TideGraph } from '../Tide/TideGraph';
import { FishingCompassModal } from '../Compass/FishingCompassModal';
import { PatternPredictionModal } from '../Analytics/PatternPredictionModal';
import { useLanguage } from '../../i18n/LanguageContext';
import { 
  X, MapPin, Star, AlertTriangle, Car, Compass, Waves, 
  Fish, Calendar, Clock, Edit2, Trash2, Plus, ExternalLink, 
  Camera, Image as ImageIcon, ShieldAlert, ArrowRight, Ban, Target,
  Wind, Sparkles
} from 'lucide-react';
import { formatTideName, formatSpeciesName, formatBottomType, formatSpotType, formatSpotName, formatSeason, formatTimeOfDay } from '../../utils/formatI18n';

interface SpotDetailModalProps {
  spot: FishingSpot;
  catches: CatchLog[];
  onClose: () => void;
  onEdit: (spot: FishingSpot) => void;
  onDelete: (spotId: string) => void;
  onAddCatch: (spot: FishingSpot) => void;
  onSelectCatch: (catchLog: CatchLog) => void;
  onSpotUpdated: () => void;
}

const SNAG_RISK_MAP: Record<string, { label: string; subLabel: string; color: string }> = {
  low: { label: 'Geringes Hängerisiko', subLabel: 'Sand / Freiwasser', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800' },
  medium: { label: 'Mäßiges Hängerisiko', subLabel: 'Steinpackung / Riff', color: 'text-amber-400 bg-amber-950/60 border-amber-800' },
  high: { label: 'Hohes Hängerisiko', subLabel: 'Dichtes Totholz / Tetrapoden', color: 'text-rose-400 bg-rose-950/60 border-rose-800' },
  unknown: { label: 'Unbekanntes Risiko', subLabel: '', color: 'text-slate-400 bg-slate-800/60 border-slate-700' }
};

const SPOT_TYPE_LABELS: Record<string, string> = {
  breakwater: 'Mole / Hafenmole',
  rocky: 'Felsküste / Steinpackung',
  surf: 'Brandungsstrand / Strand',
  estuary: 'Flussmündung / Brackwasser',
  lake_pond: 'See / Baggersee / Talsperre',
  port: 'Hafen / Marina',
  boat: 'Boot / Auf See',
  stream: 'Bach / Forellengewässer',
  unknown: 'Unbekannt'
};

export const SpotDetailModal: React.FC<SpotDetailModalProps> = ({
  spot,
  catches,
  onClose,
  onEdit,
  onDelete,
  onAddCatch,
  onSelectCatch,
  onSpotUpdated
}) => {
  const { isEn, unitSystem, formatDepth } = useLanguage();
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<StoredPhoto | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Tactical Fishing Tool Modals
  const [showTideGraph, setShowTideGraph] = useState<boolean>(false);
  const [showCompass, setShowCompass] = useState<boolean>(false);
  const [showPatternPrediction, setShowPatternPrediction] = useState<boolean>(false);

  useEffect(() => {
    loadSpotPhotos();
  }, [spot.photoIds]);

  const loadSpotPhotos = async () => {
    if (spot.photoIds && spot.photoIds.length > 0) {
      const loaded = await getPhotosByIds(spot.photoIds);
      setPhotos(loaded);
    } else {
      setPhotos([]);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newPhotoIds = [...(spot.photoIds || [])];
      for (let i = 0; i < files.length; i++) {
        const photo = await processAndAutoSavePhoto(files[i], {
          spotId: spot.id,
          caption: `${spot.name} condition photo`
        });
        newPhotoIds.push(photo.id);
      }
      
      spot.photoIds = newPhotoIds;
      spot.updatedAt = new Date().toISOString();
      const { saveSpot } = await import('../../services/db');
      await saveSpot(spot);
      await loadSpotPhotos();
      onSpotUpdated();
    } catch (err) {
      console.error('Photo save error:', err);
      alert('An error occurred while automatically saving the photo.');
    } finally {
      setIsUploading(false);
    }
  };

  const spotCatches = catches.filter((c) => c.spotId === spot.id);
  const totalCatchQuantity = spotCatches.reduce((sum, c) => sum + (c.isNoCatch ? 0 : (c.quantity || 1)), 0);

  const handleToggleAvoid = async () => {
    const nextAvoid = !spot.avoidSpot;
    spot.avoidSpot = nextAvoid;
    if (nextAvoid) {
      if (spot.favorite) spot.favorite = false;
      if (spot.wishlistSpot) spot.wishlistSpot = false;
    }
    spot.updatedAt = new Date().toISOString();
    try {
      const { saveSpot } = await import('../../services/db');
      await saveSpot(spot);
      onSpotUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleWishlist = async () => {
    const nextWishlist = !spot.wishlistSpot;
    spot.wishlistSpot = nextWishlist;
    if (nextWishlist && spot.avoidSpot) spot.avoidSpot = false;
    spot.updatedAt = new Date().toISOString();
    try {
      const { saveSpot } = await import('../../services/db');
      await saveSpot(spot);
      onSpotUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 shrink-0 gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 min-w-0">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/30 whitespace-nowrap shrink-0">
                {SPOT_TYPE_LABELS[spot.spotType] || spot.spotType}
              </span>
              {spot.favorite && (
                <span className="flex items-center gap-1 text-xs font-bold text-amber-400 whitespace-nowrap shrink-0">
                  <Star className="w-3.5 h-3.5 fill-amber-400" /> Favorite
                </span>
              )}
              {spot.wishlistSpot && (
                <span className="flex items-center gap-1 text-xs font-bold text-purple-300 bg-purple-950/90 px-2 py-0.5 rounded border border-purple-600 whitespace-nowrap shrink-0">
                  <Target className="w-3.5 h-3.5 shrink-0" />
                  <span>{spot.planDate ? `📅 ${spot.planDate} Trip Planned` : '🎯 Wishlist'}</span>
                </span>
              )}
              {spot.avoidSpot && (
                <span className="flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-950/90 px-2 py-0.5 rounded border border-rose-600 whitespace-nowrap shrink-0">
                  <Ban className="w-3.5 h-3.5 shrink-0" /> Avoid (Blacklisted)
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white truncate">{formatSpotName(spot.name)}</h2>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              onClick={handleToggleWishlist}
              className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                spot.wishlistSpot
                  ? 'text-purple-300 hover:text-purple-200 bg-purple-950/60 border border-purple-600'
                  : 'text-slate-400 hover:text-purple-300 hover:bg-slate-800'
              }`}
              title={spot.wishlistSpot ? 'Rimuovi dalla lista dei desideri' : 'Aggiungi alla lista desideri / Piano di pesca'}
            >
              <Target className="w-4 h-4" />
            </button>
            <button
              onClick={handleToggleAvoid}
              className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                spot.avoidSpot
                  ? 'text-rose-400 hover:text-rose-300 bg-rose-950/50 border border-rose-700'
                  : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
              }`}
              title={spot.avoidSpot ? 'Rimuovi contrassegno da evitare' : 'Contrassegna come spot da evitare'}
            >
              <Ban className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(spot)}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Modifica spot"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 sm:p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors"
              title="Elimina spot"
              aria-label="Elimina spot"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-0.5 sm:ml-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* Avoid / Blacklist Notice Banner */}
          {spot.avoidSpot && (
            <div className="p-3.5 sm:p-4 rounded-xl bg-rose-950/40 border-2 border-rose-500/60 shadow-lg shadow-rose-950/30 space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs sm:text-sm">
                  <Ban className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span>⛔ Marked as Avoid (Blacklisted Spot)</span>
                </div>
                <button
                  onClick={handleToggleAvoid}
                  className="text-[11px] text-rose-300 hover:text-white bg-rose-900/60 hover:bg-rose-800 px-2.5 py-1 rounded-lg border border-rose-700 transition-colors shrink-0 font-medium whitespace-nowrap"
                >
                  Unmark
                </button>
              </div>

              {spot.avoidTags && spot.avoidTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {spot.avoidTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-0.5 bg-rose-900/80 text-rose-200 border border-rose-600/60 rounded-lg font-medium whitespace-nowrap shrink-0"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {spot.avoidReason ? (
                <div className="text-xs text-rose-200/90 bg-slate-950/60 p-3 rounded-lg border border-rose-800/60 leading-relaxed whitespace-pre-wrap">
                  <span className="font-semibold text-rose-400 block mb-0.5">Reason & Warning Notes:</span>
                  {spot.avoidReason}
                </div>
              ) : (
                <p className="text-xs text-rose-300/80">
                  No avoid reason specified. Click "Edit Spot" to add hazard and avoidance notes.
                </p>
              )}
            </div>
          )}

          {/* Wishlist & Expedition Plan Banner */}
          {spot.wishlistSpot && (
            <div className="p-3.5 sm:p-4 rounded-xl bg-purple-950/40 border-2 border-purple-500/60 shadow-lg shadow-purple-950/30 space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-xs sm:text-sm min-w-0">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-purple-400" />
                  <span className="truncate">
                    {spotCatches.length > 0
                      ? '🎯 Trip Logged (Active Catches Recorded)'
                      : spot.planDate 
                        ? `📅 Trip Planned: ${spot.planDate}` 
                        : '🎯 Spot obiettivo (Lista desideri)'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {spotCatches.length > 0 && (
                    <button
                      onClick={handleToggleWishlist}
                      className="text-[11px] text-emerald-300 hover:text-white bg-emerald-950/80 hover:bg-emerald-800 px-2 py-1 rounded-lg border border-emerald-600 transition-colors font-medium whitespace-nowrap"
                    >
                      Mark as Explored
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(spot)}
                    className="text-[11px] text-purple-200 hover:text-white bg-purple-900/60 hover:bg-purple-800 px-2 py-1 rounded-lg border border-purple-700 transition-colors font-medium flex items-center gap-1 whitespace-nowrap"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit Plan
                  </button>
                  <button
                    onClick={handleToggleWishlist}
                    className="text-[11px] text-purple-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-2 py-1 rounded-lg border border-slate-700 transition-colors font-medium whitespace-nowrap"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {spot.wishlistTags && spot.wishlistTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {spot.wishlistTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-0.5 bg-purple-900/80 text-purple-200 border border-purple-600/60 rounded-lg font-medium whitespace-nowrap shrink-0"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {spot.planNotes ? (
                <div className="text-xs text-purple-100 bg-slate-950/60 p-3 rounded-lg border border-purple-800/60 leading-relaxed whitespace-pre-wrap">
                  <span className="font-semibold text-purple-300 block mb-0.5">Expedition Plan & Tackle Notes:</span>
                  {spot.planNotes}
                </div>
              ) : (
                <p className="text-xs text-purple-300/80">
                  No plan notes recorded yet. Click "Edit Plan" to register tackle, date, and tactics.
                </p>
              )}
            </div>
          )}

          {/* Coordinates & Google Map External Link */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-mono whitespace-nowrap">
              <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Lat {spot.lat.toFixed(5)}° · Lng {spot.lng.toFixed(5)}°</span>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 transition-colors whitespace-nowrap"
            >
              <span>Open in Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Tactical Fishing Tools Deck */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Tide Graph Card */}
            <button
              type="button"
              onClick={() => setShowTideGraph(true)}
              className="p-3 bg-gradient-to-br from-cyan-950/40 to-slate-950 border border-cyan-800/50 hover:border-cyan-500/80 rounded-xl flex items-center justify-between text-left group transition-all shadow-sm min-w-0"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 whitespace-nowrap">
                  <Waves className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
                  <span>Tide Graph & Currents</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">24h water curve, high/low & swell</p>
              </div>
              <ArrowRight className="w-4 h-4 text-cyan-500/60 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>

            {/* Compass Card */}
            <button
              type="button"
              onClick={() => setShowCompass(true)}
              className="p-3 bg-gradient-to-br from-sky-950/40 to-slate-950 border border-sky-800/50 hover:border-sky-500/80 rounded-xl flex items-center justify-between text-left group transition-all shadow-sm min-w-0"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300 whitespace-nowrap">
                  <Wind className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform shrink-0" />
                  <span>Wind & Digital Compass</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">Live heading, headwind / tailwind</p>
              </div>
              <ArrowRight className="w-4 h-4 text-sky-500/60 group-hover:text-sky-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>

            {/* Pattern Prediction Card */}
            <button
              type="button"
              onClick={() => setShowPatternPrediction(true)}
              className="p-3 bg-gradient-to-br from-purple-950/40 to-slate-950 border border-purple-800/50 hover:border-purple-500/80 rounded-xl flex items-center justify-between text-left group transition-all shadow-sm min-w-0"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300 whitespace-nowrap">
                  <Sparkles className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform shrink-0" />
                  <span>Prime Bite Prediction</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">Peak windows from catch history</p>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-500/60 group-hover:text-purple-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>
          </div>

          {/* Key Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {/* Water Depth */}
            <div className="p-3 sm:p-3.5 bg-slate-950/40 rounded-xl border border-slate-800 min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Waves className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate">Wassertiefe</span>
              </div>
              <div className="text-sm font-medium text-slate-200 truncate whitespace-nowrap">
                {(() => {
                  if (!spot.waterDepth) return 'Nicht erfasst';
                  if (unitSystem === 'imperial') {
                    const match = spot.waterDepth.match(/(\d+(?:\.\d+)?)/g);
                    if (match && match.length > 0) {
                      const converted = match.map(n => `${Math.round(parseFloat(n) * 3.28084)} ft`).join(' - ');
                      return `${spot.waterDepth} (${converted})`;
                    }
                  }
                  return spot.waterDepth;
                })()}
              </div>
            </div>

            {/* Bottom Type */}
            <div className="p-3 sm:p-3.5 bg-slate-950/40 rounded-xl border border-slate-800 min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Compass className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate">Gewässergrund</span>
              </div>
              <div className="text-sm font-medium text-slate-200 truncate">
                {spot.bottomType && spot.bottomType.length > 0
                  ? spot.bottomType.map(formatBottomType).join(', ')
                  : 'Nicht angegeben'}
              </div>
            </div>

            {/* Snag Risk */}
            <div className="p-3 sm:p-3.5 bg-slate-950/40 rounded-xl border border-slate-800 min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Snag Risk</span>
              </div>
              <div className={`text-xs font-semibold px-2 py-0.5 rounded border inline-flex items-center gap-1 whitespace-nowrap shrink-0 ${SNAG_RISK_MAP[spot.snagRisk]?.color}`}>
                <span>
                  {SNAG_RISK_MAP[spot.snagRisk]?.label || spot.snagRisk}
                </span>
                {SNAG_RISK_MAP[spot.snagRisk]?.subLabel && (
                  <span className="text-[10px] opacity-80 font-normal">
                    ({SNAG_RISK_MAP[spot.snagRisk]?.subLabel})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Memo */}
          {spot.description && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Descrizione & Caratteristiche dello Spot</h3>
              <div className="p-3.5 sm:p-4 bg-slate-950/40 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                {spot.description}
              </div>
            </div>
          )}

          {/* Current & Tidal flow notes */}
          {spot.currentNotes && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Currents & Tidal Flow Behavior</h3>
              <div className="p-3.5 sm:p-4 bg-slate-950/40 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                {spot.currentNotes}
              </div>
            </div>
          )}

          {/* Access, Parking & Safety Regulations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3.5 sm:p-4 bg-slate-950/40 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-2">
                <Car className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Parken & Anfahrt</span>
              </div>
              <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                {spot.parkingInfo || 'Keine Parkplatz-Notizen.'}
              </p>
            </div>

            <div className="p-3.5 sm:p-4 bg-slate-950/40 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Gefahren & Sicherheitshinweise</span>
              </div>
              <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                {spot.hazardAndAccessNotes || 'Keine besonderen Gefahren gemeldet.'}
              </p>
            </div>
          </div>

          {/* Target Species & Seasons */}
          <div className="flex flex-wrap gap-3 sm:gap-4 p-3.5 sm:p-4 bg-slate-950/30 rounded-xl border border-slate-800/80 text-xs">
            <div>
              <span className="text-slate-400 block mb-1 font-medium">Zielfischarten :</span>
              <div className="flex flex-wrap gap-1.5">
                {spot.targetSpecies && spot.targetSpecies.length > 0 ? (
                  spot.targetSpecies.map((sp, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-800 text-sky-300 rounded font-medium whitespace-nowrap shrink-0">
                      {formatSpeciesName(sp)}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500">Not specified</span>
                )}
              </div>
            </div>

            <div className="h-auto w-px bg-slate-800 mx-1 hidden sm:block"></div>

            <div>
              <span className="text-slate-400 block mb-1 font-medium">Prime Seasons:</span>
              <div className="flex flex-wrap gap-1.5">
                {spot.bestSeasons && spot.bestSeasons.length > 0 ? (
                  spot.bestSeasons.map((season, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded whitespace-nowrap shrink-0">
                      {formatSeason(season)}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500">All Year</span>
                )}
              </div>
            </div>

            <div className="h-auto w-px bg-slate-800 mx-1 hidden sm:block"></div>

            <div>
              <span className="text-slate-400 block mb-1 font-medium">Best Times:</span>
              <div className="flex flex-wrap gap-1.5">
                {spot.bestTimeOfDay && spot.bestTimeOfDay.length > 0 ? (
                  spot.bestTimeOfDay.map((time, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded whitespace-nowrap shrink-0">
                      {formatTimeOfDay(time)}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500">Any Time</span>
                )}
              </div>
            </div>
          </div>

          {/* Sub points (Secret stands / casts) */}
          {spot.subPoints && spot.subPoints.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Stands & Cast Waypoints</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {spot.subPoints.map((sub) => (
                  <div key={sub.id} className="p-3 bg-slate-950/40 rounded-lg border border-slate-800 text-xs">
                    <div className="font-semibold text-sky-400 mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{sub.name}</span>
                    </div>
                    {sub.note && <p className="text-slate-300">{sub.note}</p>}
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                      {sub.lat.toFixed(5)}, {sub.lng.toFixed(5)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Spot Photos */}
          <div>
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 truncate">Foto dello Spot (Salvate localmente)</h3>
                <span className="text-xs text-slate-500 font-mono shrink-0">({photos.length})</span>
              </div>
              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg text-xs font-medium cursor-pointer transition-colors border border-slate-700 whitespace-nowrap shrink-0">
                <Camera className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Saving...' : 'Add Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>

            {photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className="group relative aspect-video sm:aspect-square bg-slate-950 rounded-xl overflow-hidden border border-slate-800 cursor-pointer hover:border-sky-500 transition-all"
                  >
                    <img
                      src={photo.dataUrl}
                      alt={photo.caption || 'Foto dello spot'}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <p className="text-[11px] text-white truncate">{photo.caption || photo.fileName}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-950/30 rounded-xl border border-dashed border-slate-800 text-xs text-slate-500">
                <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-60" />
                <p>Nessuna foto ancora registrata per questo spot.</p>
                <p className="text-[11px] text-slate-600 mt-1">Salva foto di accessi, punti di riferimento o scogliere per consultarle offline.</p>
              </div>
            )}
          </div>

          {/* Spot Catches List */}
          <div>
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 truncate">Catch Logs at this Spot</h3>
                <span className="text-xs text-slate-500 font-mono shrink-0 whitespace-nowrap">({spotCatches.length} outings / {totalCatchQuantity} fish)</span>
              </div>
              <button
                onClick={() => onAddCatch(spot)}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow-sm transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Log Catch</span>
              </button>
            </div>

            {spotCatches.length > 0 ? (
              <div className="space-y-2">
                {spotCatches.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => onSelectCatch(c)}
                    className="flex items-center justify-between p-3 bg-slate-950/60 hover:bg-slate-800/80 rounded-xl border border-slate-800/80 cursor-pointer transition-colors gap-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center font-bold shrink-0 ${
                        c.isNoCatch
                           ? 'bg-slate-800/80 border-slate-700/80 text-slate-400'
                          : 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                      }`}>
                        {c.isNoCatch ? <Compass className="w-4 h-4 opacity-75" /> : <Fish className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        {c.isNoCatch ? (
                          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                            <span className="font-bold text-slate-300 text-sm whitespace-nowrap">No Catch Logged</span>
                            <span className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.2 rounded whitespace-nowrap shrink-0">
                              Scouting Outing
                            </span>
                            <span className="text-xs text-slate-500 font-mono whitespace-nowrap shrink-0">0 fish</span>
                          </div>
                        ) : c.items && c.items.length > 1 ? (
                          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                            <span className="font-bold text-white text-sm truncate max-w-[140px] sm:max-w-none">{formatSpeciesName(c.species)}</span>
                            <span className="text-xs font-mono text-sky-300 bg-sky-950/80 border border-sky-800/80 px-1.5 py-0.2 rounded whitespace-nowrap shrink-0">
                              Total {c.quantity} fish ({c.items.length} species)
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                            <span className="font-bold text-white text-sm truncate max-w-[140px] sm:max-w-none">{formatSpeciesName(c.species)}</span>
                            {c.sizeCm && (
                              <span className="text-sky-400 font-mono font-bold text-xs sm:text-sm whitespace-nowrap shrink-0">
                                {c.sizeCm}cm
                              </span>
                            )}
                            <span className="text-xs text-slate-400 font-mono whitespace-nowrap shrink-0">{c.quantity} fish</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0 truncate mt-0.5">
                          <span className="whitespace-nowrap">{c.date}</span>
                          {c.weather.tideName && (
                            <>
                              <span>·</span>
                              <span className="whitespace-nowrap text-amber-300/90">{formatTideName(c.weather.tideName)}</span>
                            </>
                          )}
                          {c.lureOrBait && (
                            <>
                              <span>·</span>
                              <span className="text-slate-400 truncate">{c.lureOrBait}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 text-center bg-slate-950/20 rounded-xl border border-slate-800/60 text-xs text-slate-500">
                Nessuna cattura ancora registrata in questo spot. Premi "+ Registra Cattura" per aggiungerne una.
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0 gap-2">
          <span className="text-xs text-slate-500 whitespace-nowrap">
            Registered: {new Date(spot.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
          <button
            onClick={() => onAddCatch(spot)}
            className="px-3.5 sm:px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-sky-950 whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Log Catch at this Spot</span>
          </button>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        title={`Delete "${spot.name}"?`}
        message="Are you sure you want to delete this fishing spot? This action cannot be undone."
        subMessage="Nota: Le catture collegate a questa posizione rimarranno conservate."
        confirmLabel="Elimina spot"
        cancelLabel="Annulla"
        isDeleting={isDeleting}
        onConfirm={async () => {
          setIsDeleting(true);
          try {
            await onDelete(spot.id);
          } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
          }
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Lightbox Photo Preview */}
      {selectedPhoto && (
        <div 
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-[1300] bg-black/95 flex flex-col items-center justify-center p-4"
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-2"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedPhoto.dataUrl}
            alt={selectedPhoto.caption || 'Enlarged photo'}
            referrerPolicy="no-referrer"
            className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg"
          />
          <p className="text-sm text-slate-300 mt-3 font-medium">{selectedPhoto.caption || selectedPhoto.fileName}</p>
          <span className="text-xs text-slate-500">{new Date(selectedPhoto.capturedAt).toLocaleString('en-US')}</span>
        </div>
      )}

      {/* Tide Graph Modal */}
      {showTideGraph && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center p-1.5 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[96vh] overflow-y-auto">
            <TideGraph
              spotName={spot.name}
              lat={spot.lat}
              lng={spot.lng}
              onClose={() => setShowTideGraph(false)}
            />
          </div>
        </div>
      )}

      {/* Compass & Wind Modal */}
      {showCompass && (
        <FishingCompassModal
          spotName={spot.name}
          initialLat={spot.lat}
          initialLng={spot.lng}
          spots={[spot]}
          onClose={() => setShowCompass(false)}
        />
      )}

      {/* Pattern Prediction Modal */}
      {showPatternPrediction && (
        <PatternPredictionModal
          spots={[spot]}
          catches={catches}
          currentSpot={spot}
          onClose={() => setShowPatternPrediction(false)}
        />
      )}
    </div>
  );
};
