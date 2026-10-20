import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { WifiOff, Database, HardDrive, CheckCircle, RefreshCw, X, Layers } from 'lucide-react';
import { getOfflineCacheStats, CacheStats, clearMapTilesCache } from '../../services/offlineCache';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [clearing, setClearing] = useState(false);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const data = await getOfflineCacheStats();
      setStats(data);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (showStatusModal) {
      loadStats();
    }
  }, [showStatusModal]);

  const handleClearTiles = async () => {
    if (!confirm('Clear cached map tiles? (Your catch logs, GPS waypoints, and tackle data will NOT be deleted)')) {
      return;
    }
    setClearing(true);
    try {
      await clearMapTilesCache();
      await loadStats();
    } finally {
      setClearing(false);
    }
  };

  return (
    <>
      {/* Offline Toast Banner */}
      {!isOnline && (
        <div
          onClick={() => setShowStatusModal(true)}
          className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-amber-600/95 text-white text-xs font-semibold shadow-2xl backdrop-blur-md border border-amber-400/50 cursor-pointer hover:bg-amber-500 transition-all animate-bounce duration-1000"
          title="Click to check offline cache status"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-100"></span>
          </span>
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Offline Mode (Serving from Cache)</span>
        </div>
      )}

      {/* Offline & Cache Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl border ${isOnline ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                  {isOnline ? <CheckCircle className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {isOnline ? 'Network Connected (Online)' : 'Offline Operation Mode'}
                  </h3>
                  <p className="text-xs text-slate-400">Powered by device storage & IndexedDB</p>
                </div>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  Cached Map Tiles
                </span>
                <span className="font-mono font-bold text-white">
                  {stats ? `${stats.mapTilesCount} tiles` : (loadingStats ? 'Checking...' : '0 tiles')}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  IndexedDB Local Persistence
                </span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Active (100% On-Device)
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-indigo-400" />
                  Device Storage Used
                </span>
                <span className="font-mono font-bold text-white">
                  {stats?.totalStorageUsageMB !== null && stats?.totalStorageUsageMB !== undefined
                    ? `${stats.totalStorageUsageMB} MB`
                    : 'Unavailable'}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-purple-400" />
                  Service Worker Status
                </span>
                <span className={`font-semibold ${stats?.isServiceWorkerReady ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {stats?.isServiceWorkerReady ? 'Active (PWA Offline)' : 'Standby'}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-800/40 p-3 rounded-lg border border-slate-800">
              💡 <strong>Pro Tip for Offshore & Remote Spots</strong>: Before heading to remote coastal waters or mountain lakes, pan and zoom across today's fishing map on your home Wi-Fi. Tiles will automatically save to your device for crystal-clear offline viewing even with zero cellular signal.
            </div>

            <div className="flex items-center justify-between pt-1 gap-2">
              <button
                onClick={handleClearTiles}
                disabled={clearing || !stats?.mapTilesCount}
                className="text-xs text-rose-300 hover:text-white hover:bg-rose-950/60 px-3 py-2 rounded-xl border border-rose-900/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {clearing ? 'Clearing...' : 'Clear Map Cache'}
              </button>

              <button
                onClick={() => setShowStatusModal(false)}
                className="text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
