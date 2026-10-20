import React, { useState, useEffect } from 'react';
import { CatchLog, FishingSpot, StoredPhoto } from '../../types/fishing';
import { processAndAutoSavePhoto, getPhotosByIds } from '../../services/photoStorage';
import { useLanguage } from '../../i18n/LanguageContext';
import { DeleteConfirmModal } from '../Common/DeleteConfirmModal';
import { CatchShareModal } from './CatchShareModal';
import { 
  Calendar, Clock, MapPin, Fish, Edit2, Trash2, X, 
  CloudSun, Camera, ImageIcon, Share2
} from 'lucide-react';
import { formatTideName, formatTideState, formatWaveCondition, formatWeatherCondition, formatSpeciesName, formatSpotName } from '../../utils/formatI18n';

interface CatchDetailModalProps {
  catchLog: CatchLog;
  spot?: FishingSpot;
  onClose: () => void;
  onEdit: (catchLog: CatchLog) => void;
  onDelete: (catchId: string) => void;
  onGoToSpot?: (spotId: string) => void;
  onCatchUpdated: () => void;
}

export const CatchDetailModal: React.FC<CatchDetailModalProps> = ({
  catchLog,
  onClose,
  onEdit,
  onDelete,
  onGoToSpot,
  onCatchUpdated,
}) => {
  const { isEn, formatLength, formatWeight, formatTemp, formatWind } = useLanguage();
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<StoredPhoto | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    loadPhotos();
  }, [catchLog.id, catchLog.photoIds]);

  const loadPhotos = async () => {
    try {
      if (catchLog.photoIds && catchLog.photoIds.length > 0) {
        const loaded = await getPhotosByIds(catchLog.photoIds);
        setPhotos(loaded);
      } else {
        setPhotos([]);
      }
    } catch (err) {
      console.error('Failed to load photos:', err);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newPhotoIds = [...(catchLog.photoIds || [])];
      for (let i = 0; i < files.length; i++) {
        const caption = catchLog.isNoCatch
          ? `Trip Photo (${catchLog.spotName})`
          : `${catchLog.species} (${catchLog.sizeCm ? catchLog.sizeCm + 'cm' : ''})`;
        const photo = await processAndAutoSavePhoto(files[i], {
          spotId: catchLog.spotId,
          catchLogId: catchLog.id,
          caption
        });
        newPhotoIds.push(photo.id);
      }

      catchLog.photoIds = newPhotoIds;
      catchLog.updatedAt = new Date().toISOString();
      const { saveCatch } = await import('../../services/db');
      await saveCatch(catchLog);
      await loadPhotos();
      onCatchUpdated();
    } catch (err) {
      console.error(err);
      alert('Failed to save photo');
    } finally {
      setIsUploading(false);
    }
  };

  const weather = catchLog.weather;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 shrink-0 gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1 font-mono whitespace-nowrap overflow-hidden">
              <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>{catchLog.date}</span>
              {catchLog.time && (
                <>
                  <span className="text-slate-600">·</span>
                  <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>{catchLog.time}</span>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2 min-w-0 truncate">
                {catchLog.isNoCatch ? (
                  <span className="text-slate-300">No Catch (Skunked)</span>
                ) : (
                  <>
                    <span className="truncate">{formatSpeciesName(catchLog.species)}</span>
                    {catchLog.sizeCm && (
                      <span className="text-sky-400 font-mono text-xl sm:text-2xl whitespace-nowrap shrink-0">
                        {formatLength(catchLog.sizeCm)}
                      </span>
                    )}
                  </>
                )}
              </h2>
              {catchLog.isNoCatch && (
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full whitespace-nowrap shrink-0">
                  Scouting / Exploration
                </span>
              )}
              {!catchLog.isNoCatch && catchLog.items && catchLog.items.length > 1 && (
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded-full whitespace-nowrap shrink-0">
                  {catchLog.items.length} Species
                </span>
              )}
            </div>

            <div 
              onClick={() => onGoToSpot && onGoToSpot(catchLog.spotId)}
              className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 cursor-pointer mt-1 font-medium transition-colors truncate"
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{formatSpotName(catchLog.spotName)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {!catchLog.isNoCatch && (
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 rounded-lg text-xs font-bold transition-colors"
                title="Genera scheda cattura (Spot segreto)"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Condividi</span>
              </button>
            )}
            <button
              onClick={() => onEdit(catchLog)}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Modifica cattura"
              aria-label="Modifica cattura"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 sm:p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors"
              title="Elimina cattura"
              aria-label="Elimina cattura"
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          
          {/* Size / Weight / Quantity Summary Badges */}
          {catchLog.isNoCatch ? (
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="p-2.5 sm:p-3.5 bg-slate-950/50 rounded-xl border border-slate-800 text-center min-w-0">
                <span className="text-[10px] text-slate-400 block mb-0.5 sm:mb-1 truncate">Catch Status</span>
                <div className="font-bold text-amber-400 text-xs sm:text-sm whitespace-nowrap truncate">
                  No Catch Logged
                </div>
              </div>

              <div className="p-2.5 sm:p-3.5 bg-slate-950/50 rounded-xl border border-slate-800 text-center min-w-0">
                <span className="text-[10px] text-slate-400 block mb-0.5 sm:mb-1 truncate">Fish Count</span>
                <div className="font-mono text-sm sm:text-base font-bold text-slate-400 whitespace-nowrap">
                  0 fish
                </div>
              </div>

              <div className="p-2.5 sm:p-3.5 bg-slate-950/50 rounded-xl border border-slate-800 text-center min-w-0">
                <span className="text-[10px] text-slate-400 block mb-0.5 sm:mb-1 truncate">Trip Purpose</span>
                <div className="text-xs sm:text-sm font-bold text-slate-300 whitespace-nowrap truncate">
                  Scouting & Exploration
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="p-2.5 sm:p-3.5 bg-slate-950/50 rounded-xl border border-slate-800 text-center min-w-0">
                <span className="text-[10px] text-slate-400 block mb-0.5 sm:mb-1 truncate">
                  {catchLog.items && catchLog.items.length > 1 ? 'Max. Länge' : 'Länge / Größe'}
                </span>
                <div className="font-mono text-sm sm:text-base font-bold text-sky-400 whitespace-nowrap truncate">
                  {catchLog.sizeCm ? formatLength(catchLog.sizeCm) : 'Nicht gemessen'}
                </div>
              </div>

              <div className="p-2.5 sm:p-3.5 bg-slate-950/50 rounded-xl border border-slate-800 text-center min-w-0">
                <span className="text-[10px] text-slate-400 block mb-0.5 sm:mb-1 truncate">
                  {catchLog.items && catchLog.items.length > 1 ? 'Gesamtgewicht' : 'Gewicht'}
                </span>
                <div className="font-mono text-sm sm:text-base font-bold text-slate-200 whitespace-nowrap truncate">
                  {catchLog.weightGrams ? formatWeight(catchLog.weightGrams) : 'Nicht gemessen'}
                </div>
              </div>

              <div className="p-2.5 sm:p-3.5 bg-slate-950/50 rounded-xl border border-slate-800 text-center min-w-0">
                <span className="text-[10px] text-slate-400 block mb-0.5 sm:mb-1 truncate">
                  Total Count
                </span>
                <div className="font-mono text-sm sm:text-base font-bold text-slate-200 whitespace-nowrap truncate">
                  {catchLog.quantity || 1} fish
                </div>
              </div>
            </div>
          )}

          {/* Multi-species Breakdown Card (if multiple fish items exist) */}
          {!catchLog.isNoCatch && catchLog.items && catchLog.items.length > 0 && (
            <div className="p-3.5 sm:p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <div className="flex items-center gap-1.5">
                  <Fish className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Riepilogo catture ({catchLog.items.length} specie · Totale {catchLog.quantity} pesci)</span>
                </div>
              </div>

              <div className="divide-y divide-slate-800/80">
                {catchLog.items.map((item, idx) => (
                  <div key={item.id || idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-sky-500/10 text-sky-400 text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className="truncate">{formatSpeciesName(item.species)}</span>
                          {item.sizeCm ? (
                            <span className="text-xs font-mono text-sky-400 font-bold bg-sky-950/80 border border-sky-800 px-1.5 py-0.2 rounded whitespace-nowrap shrink-0">
                              {formatLength(item.sizeCm)}
                            </span>
                          ) : null}
                          {item.weightGrams ? (
                            <span className="text-xs font-mono text-slate-400 whitespace-nowrap shrink-0">
                              {formatWeight(item.weightGrams)}
                            </span>
                          ) : null}
                        </div>
                        {item.lureOrBait && (
                          <div className="text-xs text-slate-400 mt-0.5 truncate">
                            🎯 Lure/Bait: <span className="text-slate-300">{item.lureOrBait}</span>
                          </div>
                        )}
                        {item.notes && (
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {item.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs sm:text-sm font-mono font-bold text-white bg-slate-800/90 border border-slate-700/80 px-2 py-1 rounded-lg whitespace-nowrap">
                        {item.quantity || 1} fish
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weather & Tide Information Card */}
          <div className="p-3.5 sm:p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 gap-2">
              <div className="flex items-center gap-1.5 shrink-0">
                <CloudSun className="w-4 h-4 text-amber-400" />
                <span>Weather & Tide Intelligence</span>
              </div>
              {weather.tideName && (
                <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded font-semibold text-xs whitespace-nowrap shrink-0 truncate">
                  {formatTideName(weather.tideName)}{weather.tideState ? ` · ${formatTideState(weather.tideState)}` : ''}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs">
              <div className="p-2 sm:p-2.5 bg-slate-900/80 rounded-lg min-w-0">
                <span className="text-[10px] text-slate-500 block mb-0.5 truncate">Condition</span>
                <span className="font-medium text-slate-200 whitespace-nowrap truncate block">
                  {formatWeatherCondition(weather.condition)}
                </span>
              </div>

              <div className="p-2 sm:p-2.5 bg-slate-900/80 rounded-lg min-w-0">
                <span className="text-[10px] text-slate-500 block mb-0.5 truncate">Air / Water Temp</span>
                <span className="font-mono font-medium text-slate-200 whitespace-nowrap truncate block">
                  {weather.temperature !== undefined ? formatTemp(weather.temperature) : '-'} / {weather.waterTemperature !== undefined ? formatTemp(weather.waterTemperature) : '-'}
                </span>
              </div>

              <div className="p-2 sm:p-2.5 bg-slate-900/80 rounded-lg min-w-0">
                <span className="text-[10px] text-slate-500 block mb-0.5 truncate">Wind Direction & Speed</span>
                <span className="font-mono font-medium text-slate-200 whitespace-nowrap truncate block">
                  {weather.windDirection || '-'} {weather.windSpeedMs !== undefined ? formatWind(weather.windSpeedMs) : ''}
                </span>
              </div>

              <div className="p-2 sm:p-2.5 bg-slate-900/80 rounded-lg min-w-0">
                <span className="text-[10px] text-slate-500 block mb-0.5 truncate">Pressure & Waves</span>
                <span className="font-mono font-medium text-slate-200 whitespace-nowrap truncate block">
                  {weather.pressureHpa ? `${weather.pressureHpa} hPa` : '-'} / {weather.waveHeight ? formatWaveCondition(weather.waveHeight) : '-'}
                </span>
              </div>
            </div>

            {weather.moonPhase && (
              <div className="text-[11px] text-slate-400 font-mono truncate">
                {weather.moonPhase}
              </div>
            )}
          </div>

          {/* Lure & Tackle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3.5 sm:p-4 bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Effective Lure & Rig</h3>
              <p className="text-sm font-semibold text-white truncate">
                {catchLog.lureOrBait || 'Unrecorded'}
              </p>
              {catchLog.actionOrRange && (
                <div className="pt-1 text-xs text-slate-300">
                  <span className="text-slate-500 block mb-0.5">Action & Depth Range:</span>
                  <span className="break-words">{catchLog.actionOrRange}</span>
                </div>
              )}
            </div>

            <div className="p-3.5 sm:p-4 bg-slate-950/40 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between mb-1 gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0">Tackle Setup</h3>
                {catchLog.tackle?.tackleSetName && (
                  <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full truncate max-w-[140px] sm:max-w-[180px] shrink-0 whitespace-nowrap">
                    {catchLog.tackle.tackleSetName}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 py-1 border-b border-slate-800/60">
                <span className="text-slate-500 shrink-0">Rod</span>
                <span className="text-slate-200 font-medium text-right truncate max-w-[65%]">{catchLog.tackle?.rod || 'Unspecified'}</span>
              </div>
              <div className="flex items-center justify-between gap-2 py-1 border-b border-slate-800/60">
                <span className="text-slate-500 shrink-0">Reel</span>
                <span className="text-slate-200 font-medium text-right truncate max-w-[65%]">{catchLog.tackle?.reel || 'Unspecified'}</span>
              </div>
              <div className="flex items-center justify-between gap-2 py-1 border-b border-slate-800/60">
                <span className="text-slate-500 shrink-0">Line</span>
                <span className="text-sky-300 font-medium font-mono text-right truncate max-w-[65%]">{catchLog.tackle?.mainLine || 'Unspecified'}</span>
              </div>
              <div className="flex items-center justify-between gap-2 py-1">
                <span className="text-slate-500 shrink-0">Leader</span>
                <span className="text-cyan-300 font-medium font-mono text-right truncate max-w-[65%]">{catchLog.tackle?.leader || 'Unspecified'}</span>
              </div>
            </div>
          </div>

          {/* Notes & Field Impression */}
          {catchLog.notes && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Field Notes & Observations</h3>
              <div className="p-3.5 sm:p-4 bg-slate-950/40 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                {catchLog.notes}
              </div>
            </div>
          )}

          {/* Photos */}
          <div>
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 truncate">Catch Photos (Auto-Saved)</h3>
                <span className="text-xs text-slate-500 font-mono shrink-0">({photos.length})</span>
              </div>
              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg text-xs font-medium cursor-pointer transition-colors border border-slate-700 whitespace-nowrap shrink-0">
                <Camera className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Saving...' : 'Add Photos'}</span>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className="group relative aspect-square bg-slate-950 rounded-xl overflow-hidden border border-slate-800 cursor-pointer hover:border-sky-500 transition-all"
                  >
                    <img
                      src={photo.dataUrl}
                      alt={photo.caption || 'Catch photo'}
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
                <p>No photos saved yet. Tap "Add Photos" to upload.</p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        title={catchLog.isNoCatch ? 'Eliminare il report di uscita a vuoto (Cappotto)?' : `Eliminare la cattura di "${catchLog.species}"?`}
        message="Questo report di cattura (comprese foto, dati meteo e maree associati) verrà eliminato. L'operazione non può essere annullata."
        confirmLabel="Elimina cattura"
        cancelLabel="Annulla"
        isDeleting={isDeleting}
        onConfirm={async () => {
          setIsDeleting(true);
          try {
            await onDelete(catchLog.id);
          } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
          }
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Lightbox */}
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
            alt={selectedPhoto.caption || 'Enlarged catch photo'}
            referrerPolicy="no-referrer"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
          />
          <p className="text-sm text-slate-300 mt-3 font-medium">{selectedPhoto.caption || selectedPhoto.fileName}</p>
        </div>
      )}

      {/* Secret-Spot Catch Share Card Modal */}
      {showShareModal && (
        <CatchShareModal
          isOpen={showShareModal}
          catchLog={catchLog}
          photos={photos}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};
