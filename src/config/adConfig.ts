/**
 * AnglerLog Ad Banner Configuration
 * 
 * Global sponsor and marine gear banner settings.
 */

export const AD_BANNER_ENABLED = true;

export interface CustomAdItem {
  id: string;
  title: string;
  subtitle: string;
  imageUrl?: string;
  linkUrl: string;
  tag: 'PR' | 'Ad' | 'Sponsored';
  ctaText?: string;
}

export interface AdConfig {
  defaultEnabled: boolean;
  adMode: 'placeholder' | 'custom' | 'script';
  allowDismiss: boolean;
  scriptSettings: {
    client?: string;
    slot?: string;
    adFormat?: string;
  };
  customAds: CustomAdItem[];
}

export const DEFAULT_AD_CONFIG: AdConfig = {
  defaultEnabled: AD_BANNER_ENABLED,
  adMode: 'script',
  allowDismiss: false,
  scriptSettings: {
    client: 'ca-pub-5353304887278086',
    slot: '',
    adFormat: 'horizontal',
  },
  customAds: [
    {
      id: 'ad-tackle-gear-1',
      title: 'Pro Tackle & Marine Outfitters',
      subtitle: 'Tournament-grade braided lines, rods & saltwater jigs · Free Shipping',
      linkUrl: 'https://example.com/fishing-gears',
      tag: 'PR',
      ctaText: 'Explore Gear',
    },
    {
      id: 'ad-marine-weather-2',
      title: 'Marine Buoy & Solunar Forecast Pro',
      subtitle: 'Real-time offshore swell, sea surface temps & bathymetric chart overlays',
      linkUrl: 'https://example.com/marine-weather',
      tag: 'Sponsored',
      ctaText: 'Check Tides',
    },
    {
      id: 'ad-boat-kayak-3',
      title: 'Pedal-Drive Fishing Kayaks & Skiffs',
      subtitle: 'Navigate skinny water flats and secret mangrove channels with ease',
      linkUrl: 'https://example.com/kayak-fishing',
      tag: 'PR',
      ctaText: 'View Models',
    },
  ],
};

const STORAGE_KEY_CREATOR_OVERRIDE = 'anglerlog_creator_ad_override_v1';
const STORAGE_KEY_MODE = 'anglerlog_ad_banner_mode_v1';

export function isAdBannerEnabled(): boolean {
  try {
    const override = localStorage.getItem(STORAGE_KEY_CREATOR_OVERRIDE);
    if (override !== null) {
      return override === 'true';
    }
  } catch (e) {
    console.warn('Failed to read creator ad override:', e);
  }
  return AD_BANNER_ENABLED;
}

export function setCreatorAdOverride(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_CREATOR_OVERRIDE, String(enabled));
  } catch (e) {
    console.warn('Failed to set creator ad override:', e);
  }
}

export function resetCreatorAdOverride(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_CREATOR_OVERRIDE);
  } catch (e) {
    console.warn('Failed to reset creator ad override:', e);
  }
}

export function getAdBannerMode(): 'placeholder' | 'custom' | 'script' {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MODE);
    if (saved === 'placeholder' || saved === 'custom' || saved === 'script') {
      return saved;
    }
  } catch (e) {
    console.warn('Failed to read ad banner mode:', e);
  }
  return DEFAULT_AD_CONFIG.adMode;
}

export function setAdBannerMode(mode: 'placeholder' | 'custom' | 'script'): void {
  try {
    localStorage.setItem(STORAGE_KEY_MODE, mode);
  } catch (e) {
    console.warn('Failed to write ad banner mode:', e);
  }
}
