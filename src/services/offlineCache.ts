export interface CacheStats {
  mapTilesCount: number;
  weatherCacheCount: number;
  totalStorageUsageMB: number | null;
  totalStorageQuotaMB: number | null;
  isServiceWorkerReady: boolean;
}

/**
 * Fetches offline cache statistics (number of cached map tiles, weather queries, and quota).
 */
export async function getOfflineCacheStats(): Promise<CacheStats> {
  let mapTilesCount = 0;
  let weatherCacheCount = 0;
  let isServiceWorkerReady = false;

  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    isServiceWorkerReady = !!registration?.active;
  }

  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        if (name.includes('map-tiles')) {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          mapTilesCount += keys.length;
        } else if (name.includes('weather-api')) {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          weatherCacheCount += keys.length;
        }
      }
    } catch (e) {
      console.warn('Failed to inspect caches:', e);
    }
  }

  let totalStorageUsageMB: number | null = null;
  let totalStorageQuotaMB: number | null = null;

  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      if (estimate.usage !== undefined) {
        totalStorageUsageMB = Math.round((estimate.usage / (1024 * 1024)) * 10) / 10;
      }
      if (estimate.quota !== undefined) {
        totalStorageQuotaMB = Math.round((estimate.quota / (1024 * 1024)) * 10) / 10;
      }
    } catch (e) {
      console.warn('Failed to estimate storage:', e);
    }
  }

  return {
    mapTilesCount,
    weatherCacheCount,
    totalStorageUsageMB,
    totalStorageQuotaMB,
    isServiceWorkerReady,
  };
}

/**
 * Clears old map tiles from cache if user wants to free up space.
 */
export async function clearMapTilesCache(): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) return false;
  try {
    const keys = await caches.keys();
    for (const key of keys) {
      if (key.includes('map-tiles')) {
        await caches.delete(key);
      }
    }
    return true;
  } catch (err) {
    console.error('Failed to clear map tiles cache:', err);
    return false;
  }
}
