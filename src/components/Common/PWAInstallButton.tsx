import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Share, PlusSquare, X, CheckCircle2, Smartphone } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already installed and running in standalone mode, do not show install button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  // Chromium / Android / Desktop flow (standard beforeinstallprompt)
  if (isInstallable) {
    return (
      <button
        onClick={handleInstallClick}
        disabled={isInstalling}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-sky-600/90 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95 border border-sky-400/40 shrink-0 whitespace-nowrap"
        title="Install AnglerLog for offline GPS and standalone use"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden md:inline whitespace-nowrap">Install App</span>
        <span className="md:hidden whitespace-nowrap">Install</span>
      </button>
    );
  }

  // iOS Safari flow (Apple does not support beforeinstallprompt)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-sky-300 border border-slate-700 text-xs font-medium transition-all shrink-0 whitespace-nowrap"
          title="Add to iPhone / iPad Home Screen for offline field use"
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden md:inline whitespace-nowrap">Add to Home</span>
          <span className="md:hidden whitespace-nowrap">Add</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[1250] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl space-y-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Install on iOS</h3>
                    <p className="text-[11px] text-slate-400">Offline maps & full-screen fishing journal</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-600/30 text-sky-300 text-[10px] font-bold border border-sky-500/40">
                    1
                  </div>
                  <div>
                    Tap the <strong className="text-white inline-flex items-center gap-1">Share <Share className="w-3 h-3 inline text-sky-400" /></strong> button in Safari's bottom toolbar.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-600/30 text-sky-300 text-[10px] font-bold border border-sky-500/40">
                    2
                  </div>
                  <div>
                    Scroll down and select <strong className="text-white inline-flex items-center gap-1"><PlusSquare className="w-3 h-3 inline text-emerald-400" /> Add to Home Screen</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-600/30 text-sky-300 text-[10px] font-bold border border-sky-500/40">
                    3
                  </div>
                  <div>
                    Tap <strong className="text-white">Add</strong> in top right. You can now launch AnglerLog even offshore without cellular reception!
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 p-2.5 rounded-lg">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Downloaded map tiles, spots, and catch photos are cached locally in your browser storage.</span>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
