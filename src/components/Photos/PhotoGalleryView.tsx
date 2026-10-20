import React, { useState, useEffect } from 'react';
import { StoredPhoto, FishingSpot, CatchLog } from '../../types/fishing';
import { getAllPhotos, deletePhoto } from '../../services/db';
import { processAndAutoSavePhoto } from '../../services/photoStorage';
import { 
  Camera, Image as ImageIcon, Trash2, Download, X, Calendar, 
  MapPin, Fish, Plus, RefreshCw, ZoomIn 
} from 'lucide-react';

interface PhotoGalleryViewProps {
  spots: FishingSpot[];
  catches: CatchLog[];
  onSelectSpot: (spot: FishingSpot) => void;
  onSelectCatch: (catchLog: CatchLog) => void;
}

export const PhotoGalleryView: React.FC<PhotoGalleryViewProps> = ({
  spots,
  catches,
  onSelectSpot,
  onSelectCatch,
}) => {
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<StoredPhoto | null>(null);
  const [filterSpotId, setFilterSpotId] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);

  // Sort spots alphabetically
  const sortedSpots = [...spots].sort((a, b) => a.name.localeCompare(b.name, 'en'));

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const all = await getAllPhotos();
      setPhotos(all);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadNewPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        await processAndAutoSavePhoto(files[i], {
          spotId: filterSpotId !== 'all' ? filterSpotId : undefined,
          caption: files[i].name.replace(/\.[^/.]+$/, '')
        });
      }
      await loadPhotos();
    } catch (err) {
      console.error(err);
      alert('Failed to save photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Delete this photo from local device storage?')) return;
    try {
      await deletePhoto(photoId);
      if (selectedPhoto?.id === photoId) setSelectedPhoto(null);
      await loadPhotos();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPhotos = photos.filter((p) => {
    if (filterSpotId !== 'all' && p.spotId !== filterSpotId) return false;
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-950 text-slate-100">
      
      {/* Top Header & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-sky-400" />
            <span>Spot & Catch Photo Gallery</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Captured images and fish photos are saved securely and persistently in local IndexedDB
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Spot filter */}
          <select
            value={filterSpotId}
            onChange={(e) => setFilterSpotId(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500 max-w-[180px] truncate"
          >
            <option value="all">All Spots</option>
            {sortedSpots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Add photo button */}
          <label className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-950 cursor-pointer transition-colors whitespace-nowrap shrink-0">
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{isUploading ? 'Saving...' : 'Add Photos'}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUploadNewPhotos}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Photo stats */}
      <div className="text-xs text-slate-400 px-1 whitespace-nowrap">
        Stored Photos: <span className="font-mono text-white font-bold">{filteredPhotos.length}</span>
      </div>

      {/* Photos Grid */}
      {filteredPhotos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredPhotos.map((photo) => {
            const linkedSpot = spots.find((s) => s.id === photo.spotId);
            const linkedCatch = catches.find((c) => c.id === photo.catchLogId);

            return (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="group relative aspect-square bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-sky-500/80 cursor-pointer shadow-md transition-all duration-200"
              >
                <img
                  src={photo.dataUrl}
                  alt={photo.caption || 'Fishing photo'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Hover Scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-end text-white min-w-0">
                  <p className="text-xs font-semibold truncate mb-0.5 whitespace-nowrap">
                    {photo.caption || linkedCatch?.species || photo.fileName}
                  </p>
                  {linkedSpot && (
                    <p className="text-[10px] text-sky-300 truncate whitespace-nowrap">
                      📍 {linkedSpot.name}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5 whitespace-nowrap">
                    {new Date(photo.capturedAt).toLocaleDateString('en-US')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-16 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 space-y-3">
          <ImageIcon className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No Photos Stored Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Upload pictures of coastlines, secret structures, lures, or trophy catches. They remain private on this device.
          </p>
          <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer transition-colors">
            <Plus className="w-4 h-4" />
            <span>Select Photos to Save</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUploadNewPhotos}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Lightbox / Modal */}
      {selectedPhoto && (
        <div 
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-[1300] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-150"
        >
          {/* Action Top Bar */}
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="absolute top-4 left-4 right-4 flex items-center justify-between text-white"
          >
            <div className="text-xs text-slate-300 font-mono">
              {new Date(selectedPhoto.capturedAt).toLocaleString('en-US')}
            </div>

            <div className="flex items-center gap-2">
              {/* Download */}
              <a
                href={selectedPhoto.dataUrl}
                download={selectedPhoto.fileName || 'fishing_photo.jpg'}
                className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-slate-200 hover:text-white transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </a>

              {/* Delete */}
              <button
                onClick={() => handleDeletePhoto(selectedPhoto.id)}
                className="p-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/60 rounded-lg text-rose-300 hover:text-white transition-colors"
                title="Delete photo"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Close */}
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-slate-200 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Photo */}
          <img
            src={selectedPhoto.dataUrl}
            alt={selectedPhoto.caption || 'Enlarged photo'}
            referrerPolicy="no-referrer"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[80vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
          />

          {/* Caption & Associated metadata */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="mt-4 text-center text-white max-w-lg"
          >
            <h3 className="text-sm font-bold">{selectedPhoto.caption || selectedPhoto.fileName}</h3>
            {selectedPhoto.spotId && (
              <p className="text-xs text-sky-400 mt-1">
                📍 {spots.find((s) => s.id === selectedPhoto.spotId)?.name}
              </p>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
