import React, { useState } from 'react';
import { 
  X, 
  Settings2, 
  Power, 
  Check, 
  Layout, 
  Sparkles, 
  Code,
  Info 
} from 'lucide-react';
import { 
  isAdBannerEnabled, 
  setCreatorAdOverride, 
  getAdBannerMode, 
  setAdBannerMode 
} from '../../config/adConfig';

interface AdSettingsModalProps {
  isEnabled?: boolean;
  onToggleEnabled?: (val: boolean) => void;
  onConfigChanged?: () => void;
  onClose: () => void;
}

export const AdSettingsModal: React.FC<AdSettingsModalProps> = ({
  isEnabled: propIsEnabled,
  onToggleEnabled,
  onConfigChanged,
  onClose,
}) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    if (propIsEnabled !== undefined) return propIsEnabled;
    return isAdBannerEnabled();
  });
  const [selectedMode, setSelectedMode] = useState<'placeholder' | 'custom' | 'script'>(() => getAdBannerMode());
  const [showSavedFeedback, setShowSavedFeedback] = useState<boolean>(false);

  const handleToggle = (nextVal: boolean) => {
    setIsEnabled(nextVal);
    setCreatorAdOverride(nextVal);
    triggerSavedFeedback();
    if (onToggleEnabled) onToggleEnabled(nextVal);
    if (onConfigChanged) onConfigChanged();
  };

  const handleModeChange = (mode: 'placeholder' | 'custom' | 'script') => {
    setSelectedMode(mode);
    setAdBannerMode(mode);
    triggerSavedFeedback();
    if (onConfigChanged) onConfigChanged();
  };

  const triggerSavedFeedback = () => {
    setShowSavedFeedback(true);
    setTimeout(() => {
      setShowSavedFeedback(false);
    }, 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-[1300] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ad-settings-modal-title"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="ad-settings-modal-title" className="text-base sm:text-lg font-bold text-white tracking-tight">
                Ad Banner Settings (Developer / Creator)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure bottom banner display toggle and ad delivery slots
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-300">
          
          {/* Main Switch Card */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Power className={`w-4 h-4 ${isEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>Ad Banner Visibility Toggle</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isEnabled 
                    ? 'Currently ON: Slim bottom banner is active.' 
                    : 'Currently OFF: Banner is destroyed, 100% full screen for maps & logs.'}
                </p>
              </div>

              {/* Toggle Button */}
              <button
                type="button"
                onClick={() => handleToggle(!isEnabled)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isEnabled ? 'bg-sky-500' : 'bg-slate-700'
                }`}
                role="switch"
                aria-checked={isEnabled}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Zero-Space Guarantee Notification */}
            <div className="p-2.5 rounded-lg bg-sky-950/40 border border-sky-800/40 text-[11px] text-sky-300 flex items-start gap-2">
              <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span>
                <strong>Zero-Space Guarantee:</strong>{' '}
                When ads are disabled, zero DOM padding or empty placeholder blocks remain. Maps and catch logs span the entire viewport bottom edge.
              </span>
            </div>
          </div>

          {/* Ad Mode Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Select Delivery Mode
            </label>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleModeChange('placeholder')}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  selectedMode === 'placeholder'
                    ? 'bg-sky-500/10 border-sky-500/50 text-white'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-950'
                }`}
              >
                <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">Sample Gear / Outfitter Banner</span>
                    {selectedMode === 'placeholder' && <Check className="w-3.5 h-3.5 text-sky-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Displays sample marine tackle, solunar weather, and boat outfitter ads.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('custom')}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  selectedMode === 'custom'
                    ? 'bg-sky-500/10 border-sky-500/50 text-white'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-950'
                }`}
              >
                <Layout className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">Custom Affiliate / Sponsor Slot</span>
                    {selectedMode === 'custom' && <Check className="w-3.5 h-3.5 text-sky-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Displays custom sponsor links configured in src/config/adConfig.ts.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('script')}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  selectedMode === 'script'
                    ? 'bg-sky-500/10 border-sky-500/50 text-white'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-950'
                }`}
              >
                <Code className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">Google AdSense Script Slot</span>
                    {selectedMode === 'script' && <Check className="w-3.5 h-3.5 text-sky-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    Client: ca-pub-5353304887278086 (Auto Ads & Responsive Banner)
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Code Integration Guide */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Permanent Code Defaults
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Production defaults can be configured permanently in src/config/adConfig.ts via defaultEnabled.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-900/95">
          <div className="flex items-center gap-2 text-xs">
            {showSavedFeedback ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1 animate-in fade-in">
                <Check className="w-4 h-4" /> Settings Applied
              </span>
            ) : (
              <span className="text-slate-500 text-[11px]">Saved instantly to browser storage</span>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-sky-950"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
