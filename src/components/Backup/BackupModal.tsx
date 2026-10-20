import React, { useState, useEffect } from 'react';
import { exportBackup, importBackup, BackupData } from '../../services/db';
import { X, Download, Upload, Shield, Check, Layers, Database, Trash2, ShieldCheck } from 'lucide-react';
import { getOfflineCacheStats, CacheStats, clearMapTilesCache } from '../../services/offlineCache';

interface BackupModalProps {
  onClose: () => void;
  onDataRestored: () => void;
  onOpenPrivacyPolicy?: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  onClose,
  onDataRestored,
  onOpenPrivacyPolicy,
}) => {
  const [includePhotos, setIncludePhotos] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [isClearingTiles, setIsClearingTiles] = useState(false);

  const loadCache = async () => {
    try {
      const stats = await getOfflineCacheStats();
      setCacheStats(stats);
    } catch (e) {
      console.warn('Failed to load cache stats:', e);
    }
  };

  useEffect(() => {
    loadCache();
  }, []);

  const handleClearTiles = async () => {
    if (!confirm('Clear cached map tiles? Your fishing spots, catch records, and personal logs will remain completely intact.')) {
      return;
    }
    setIsClearingTiles(true);
    try {
      await clearMapTilesCache();
      await loadCache();
    } finally {
      setIsClearingTiles(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const backup = await exportBackup(includePhotos);
      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `AnglerLog_Backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to export backup file.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);
    try {
      const text = await file.text();
      const data: BackupData = JSON.parse(text);

      if (!data.spots || !data.catches) {
        throw new Error('Invalid backup file format');
      }

      const res = await importBackup(data, 'merge');
      setImportStatus(`Restore completed: ${res.spotCount} spots, ${res.catchCount} catches, ${res.tackleCount || 0} setups, ${res.photoCount} photos restored.`);
      onDataRestored();
    } catch (err: any) {
      console.error(err);
      alert('Failed to import backup: ' + (err.message || 'File format error'));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1250] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-950/70 border border-sky-800/50 flex items-center justify-center text-sky-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">Data Management & Backup</h2>
              <p className="text-[11px] text-slate-400 hidden xs:block">Local device data export, import, and cache control</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 sm:p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto">
          
          {/* Info Banner */}
          <div className="p-3 bg-sky-950/30 rounded-xl border border-sky-800/40 text-xs text-sky-200 leading-relaxed flex items-start gap-2.5">
            <Database className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              Your secret fishing spots and catch photos remain stored locally on this device. Create a JSON backup anytime for migration between devices or safekeeping.
            </div>
          </div>

          {/* Offline Cache Stats Box */}
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>Offline Storage & Map Cache</span>
              </h3>
              {cacheStats && cacheStats.mapTilesCount > 0 && (
                <button
                  onClick={handleClearTiles}
                  disabled={isClearingTiles}
                  className="text-[11px] text-slate-400 hover:text-rose-300 flex items-center gap-1 transition-colors px-2 py-0.5 rounded-lg hover:bg-rose-950/30"
                  title="Purge cached map imagery to free device storage"
                >
                  <Trash2 className="w-3 h-3 text-rose-400" />
                  <span>{isClearingTiles ? 'Clearing...' : 'Clear Map Cache'}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800/80">
                <div className="text-[11px] text-slate-400 truncate">Cached Map Tiles</div>
                <div className="text-sm font-bold font-mono text-white mt-0.5 truncate">
                  {cacheStats ? `${cacheStats.mapTilesCount} tiles` : 'Calculating...'}
                </div>
              </div>
              <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800/80">
                <div className="text-[11px] text-slate-400 truncate">Storage Consumed</div>
                <div className="text-sm font-bold font-mono text-white mt-0.5 truncate">
                  {cacheStats?.totalStorageUsageMB !== null && cacheStats?.totalStorageUsageMB !== undefined
                    ? `${cacheStats.totalStorageUsageMB} MB`
                    : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Export Box */}
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>1. Export Data Backup</span>
              </h3>
              <span className="text-[10px] font-mono text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded-full border border-sky-800/60">
                JSON
              </span>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includePhotos}
                onChange={(e) => setIncludePhotos(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0 shrink-0"
              />
              <span className="font-medium text-slate-200">Include high-resolution catch photos</span>
              <span className="text-[10px] text-slate-400 font-normal">(increases file size)</span>
            </label>

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full py-2.5 px-3 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-sky-950/40 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
              <span>{isExporting ? 'Preparing export...' : 'Download JSON Backup'}</span>
            </button>
          </div>

          {/* Import Box */}
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. Restore Data (Import)</span>
              </h3>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Select a previously exported JSON backup file. Entries will safely merge with your existing database.
            </p>

            <label className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all border border-slate-700 hover:border-slate-600 shadow-sm whitespace-nowrap">
              <Upload className="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-[2.5]" />
              <span>{isImporting ? 'Reading backup...' : 'Select Backup File to Restore'}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                disabled={isImporting}
                className="hidden"
              />
            </label>

            {importStatus && (
              <div className="flex items-start gap-2 text-xs text-emerald-300 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-800 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{importStatus}</span>
              </div>
            )}
          </div>

          {/* Privacy & Data Protection Link */}
          {onOpenPrivacyPolicy && (
            <div className="pt-1 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Stored 100% locally on this device</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPrivacyPolicy();
                }}
                className="text-sky-400 hover:text-sky-300 font-semibold text-[11px] hover:underline"
              >
                Privacy Policy
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
