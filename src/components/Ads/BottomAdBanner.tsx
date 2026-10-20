import React, { useState, useEffect, useRef } from 'react';
import { 
  DEFAULT_AD_CONFIG, 
  CustomAdItem, 
  getAdBannerMode 
} from '../../config/adConfig';
import { 
  ExternalLink, 
  Compass, 
  Anchor, 
  Sparkles 
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

interface BottomAdBannerProps {
  /**
   * Ad banner on/off toggle (controlled by creator)
   * When false, this component returns strictly null, leaving zero empty padding.
   */
  isEnabled: boolean;
}

export const BottomAdBanner: React.FC<BottomAdBannerProps> = ({
  isEnabled,
}) => {
  const { isEn } = useLanguage();
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isAdFilled, setIsAdFilled] = useState<boolean>(false);
  const adRef = useRef<HTMLModElement | null>(null);
  const adMode = getAdBannerMode();

  const ads = DEFAULT_AD_CONFIG.customAds;
  const currentAd: CustomAdItem = ads[currentAdIndex % ads.length] || ads[0];

  // Rotate custom ads periodically when custom banner is active (or while AdSense is not filled)
  useEffect(() => {
    if (!isEnabled || (adMode === 'script' && isAdFilled) || ads.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % ads.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [isEnabled, adMode, isAdFilled, ads.length]);

  // Request AdSense ad fill when rendered in script mode
  useEffect(() => {
    if (!isEnabled || adMode !== 'script') return;
    try {
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.debug('AdSense initialization:', e);
    }
  }, [isEnabled, adMode]);

  // Precise AdSense delivery detection using official `data-ad-status="filled"` attribute
  useEffect(() => {
    if (!isEnabled || adMode !== 'script') {
      setIsAdFilled(false);
      return;
    }

    const insElement = adRef.current;
    if (!insElement) return;

    const checkStatus = () => {
      const status = insElement.getAttribute('data-ad-status');
      if (status === 'filled') {
        setIsAdFilled(true);
      } else {
        setIsAdFilled(false);
      }
    };

    // Initial check in case it loaded synchronously or is already filled
    checkStatus();

    // Observe attribute changes on the <ins> tag specifically for data-ad-status
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-ad-status') {
          checkStatus();
        }
      }
    });

    observer.observe(insElement, {
      attributes: true,
      attributeFilter: ['data-ad-status'],
    });

    return () => {
      observer.disconnect();
    };
  }, [isEnabled, adMode]);

  // When disabled, return strictly null so zero margin/padding takes up viewport space
  if (!isEnabled) {
    return null;
  }

  const clientId = DEFAULT_AD_CONFIG.scriptSettings.client || 'ca-pub-5353304887278086';
  const slotId = DEFAULT_AD_CONFIG.scriptSettings.slot;
  const adFormat = DEFAULT_AD_CONFIG.scriptSettings.adFormat || 'horizontal';

  return (
    <aside
      aria-label="Sponsored Ad"
      className="shrink-0 w-full bg-slate-900/95 border-t border-slate-800 backdrop-blur-md px-3 py-1.5 sm:py-2 text-white relative z-[1050] transition-all select-none"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 min-h-[44px]">
        
        {/* Ad Content */}
        <div className={`flex ${isAdFilled ? 'flex-col sm:flex-row items-stretch sm:items-center' : 'items-center'} gap-2 sm:gap-3 min-w-0 flex-1 relative w-full h-auto`}>
          {/* PR / Sponsored Badge */}
          <span className="shrink-0 self-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 tracking-wider">
            {adMode === 'script' && isAdFilled ? 'AD' : currentAd.tag}
          </span>

          {/* AdSense Slot (Mounted in script mode)
              When filled: auto-expands naturally to creative height (50px, 90px, 100px etc.) without 70px cap.
              When unfilled: completely excluded from layout (height: 0, overflow: hidden, position: absolute). */}
          {adMode === 'script' && (
            <div 
              id="anglerlog-adsense-container"
              style={
                isAdFilled 
                  ? { display: 'block', width: '100%', height: 'auto', overflow: 'visible' }
                  : { height: 0, overflow: 'hidden', position: 'absolute', opacity: 0, pointerEvents: 'none', width: '100%' }
              }
              className={isAdFilled ? 'flex-1 w-full rounded bg-slate-950/40 border border-slate-800/80 p-1 transition-all' : ''}
            >
              <ins
                ref={adRef}
                className="adsbygoogle"
                style={{
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                  textAlign: 'center',
                }}
                data-ad-client={clientId}
                {...(slotId ? { 'data-ad-slot': slotId } : {})}
                data-ad-format={adFormat}
                data-full-width-responsive="true"
              />
            </div>
          )}

          {/* Fallback Custom / Affiliate Banner: 
              Visible when in 'custom' mode OR when in 'script' mode but AdSense is not yet filled.
              Maintains the slim, compact height of ~46-50px with zero whitespace. */}
          {(adMode !== 'script' || !isAdFilled) && (
            <a
              href={currentAd.linkUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="group flex items-center gap-2 sm:gap-3 min-w-0 flex-1 hover:opacity-95 transition-opacity py-0.5"
              title={`${currentAd.title} - ${currentAd.subtitle}`}
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                {currentAdIndex % 3 === 0 ? (
                  <Anchor className="w-4 h-4" />
                ) : currentAdIndex % 3 === 1 ? (
                  <Compass className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </div>

              <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-sky-300 truncate transition-colors">
                  {currentAd.title}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-400 truncate">
                  {currentAd.subtitle}
                </span>
              </div>

              {currentAd.ctaText && (
                <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-sky-400 group-hover:text-sky-300 shrink-0 px-2 py-1 rounded-lg bg-sky-950/40 border border-sky-800/40">
                  <span>{currentAd.ctaText}</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              )}
            </a>
          )}
        </div>

      </div>
    </aside>
  );
};
