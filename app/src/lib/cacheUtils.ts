/**
 * Cache Management Utilities
 * Provides functions to clear different types of cache and optimize loading
 */

export interface CacheStats {
  localStorage: number;
  sessionStorage: number;
  serviceWorker: boolean;
  cleared: string[];
}

/**
 * Clear all localStorage data
 */
export function clearLocalStorage(): string[] {
  const cleared: string[] = [];
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const keys = Object.keys(localStorage);
      cleared.push(...keys);
      localStorage.clear();
      console.log('✅ LocalStorage cleared:', keys.length, 'items');
    }
  } catch (e) {
    console.error('❌ Failed to clear localStorage:', e);
  }
  return cleared;
}

/**
 * Clear all sessionStorage data
 */
export function clearSessionStorage(): string[] {
  const cleared: string[] = [];
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const keys = Object.keys(sessionStorage);
      cleared.push(...keys);
      sessionStorage.clear();
      console.log('✅ SessionStorage cleared:', keys.length, 'items');
    }
  } catch (e) {
    console.error('❌ Failed to clear sessionStorage:', e);
  }
  return cleared;
}

/**
 * Clear service worker cache
 */
export async function clearServiceWorkerCache(): Promise<boolean> {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('✅ Service Worker cache cleared:', cacheNames.length, 'caches');
      return true;
    }
  } catch (e) {
    console.error('❌ Failed to clear service worker cache:', e);
  }
  return false;
}

/**
 * Unregister service workers
 */
export async function unregisterServiceWorkers(): Promise<boolean> {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(registration => registration.unregister())
      );
      console.log('✅ Service Workers unregistered:', registrations.length);
      return true;
    }
  } catch (e) {
    console.error('❌ Failed to unregister service workers:', e);
  }
  return false;
}

/**
 * Clear specific cache keys by pattern
 */
export function clearCacheByPattern(pattern: RegExp, storage: 'local' | 'session' = 'local'): string[] {
  const cleared: string[] = [];
  try {
    const storageObj = storage === 'local' ? localStorage : sessionStorage;
    if (typeof window !== 'undefined' && storageObj) {
      for (let i = storageObj.length - 1; i >= 0; i--) {
        const key = storageObj.key(i);
        if (key && pattern.test(key)) {
          storageObj.removeItem(key);
          cleared.push(key);
        }
      }
      console.log(`✅ Cleared ${cleared.length} items matching pattern:`, pattern);
    }
  } catch (e) {
    console.error('❌ Failed to clear cache by pattern:', e);
  }
  return cleared;
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
  const stats: CacheStats = {
    localStorage: 0,
    sessionStorage: 0,
    serviceWorker: false,
    cleared: [],
  };

  try {
    if (typeof window !== 'undefined') {
      if (window.localStorage) {
        stats.localStorage = localStorage.length;
      }
      if (window.sessionStorage) {
        stats.sessionStorage = sessionStorage.length;
      }
      stats.serviceWorker = 'serviceWorker' in navigator;
    }
  } catch (e) {
    console.error('❌ Failed to get cache stats:', e);
  }

  return stats;
}

/**
 * Clear all application cache (complete reset)
 */
export async function clearAllCache(): Promise<CacheStats> {
  const stats: CacheStats = {
    localStorage: 0,
    sessionStorage: 0,
    serviceWorker: false,
    cleared: [],
  };

  console.log('🧹 Starting complete cache clear...');

  // Clear localStorage
  const localCleared = clearLocalStorage();
  stats.localStorage = localCleared.length;
  stats.cleared.push(...localCleared.map(k => `localStorage:${k}`));

  // Clear sessionStorage
  const sessionCleared = clearSessionStorage();
  stats.sessionStorage = sessionCleared.length;
  stats.cleared.push(...sessionCleared.map(k => `sessionStorage:${k}`));

  // Clear service worker cache
  stats.serviceWorker = await clearServiceWorkerCache();

  // Unregister service workers
  await unregisterServiceWorkers();

  console.log('✅ Complete cache clear finished:', stats);

  return stats;
}

/**
 * Clear only task/job related cache (selective clear)
 */
export function clearTaskCache(): string[] {
  const patterns = [
    /^task_/,
    /^all_jobs_data/,
    /^availableTasks/,
    /^postedTasks/,
    /^assignedTasks/,
    /^bids/,
    /^cache_/,
  ];

  const cleared: string[] = [];

  patterns.forEach(pattern => {
    cleared.push(...clearCacheByPattern(pattern, 'local'));
    cleared.push(...clearCacheByPattern(pattern, 'session'));
  });

  console.log('✅ Task cache cleared:', cleared.length, 'items');
  return cleared;
}

/**
 * Clear only user data cache (selective clear)
 */
export function clearUserDataCache(): string[] {
  const keys = ['user', 'token', 'userId', 'profile', 'userChats', 'poster_reviews'];
  const cleared: string[] = [];

  keys.forEach(key => {
    try {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        cleared.push(`localStorage:${key}`);
      }
      if (sessionStorage.getItem(key)) {
        sessionStorage.removeItem(key);
        cleared.push(`sessionStorage:${key}`);
      }
    } catch (e) {
      console.error(`Failed to clear ${key}:`, e);
    }
  });

  console.log('✅ User data cache cleared:', cleared.length, 'items');
  return cleared;
}

/**
 * Smart cache refresh (keeps auth, clears stale data)
 */
export function smartCacheRefresh(): string[] {
  const keepKeys = ['token', 'user', 'userId']; // Keep authentication
  const cleared: string[] = [];

  try {
    // Clear stale localStorage except auth
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && !keepKeys.includes(key)) {
        localStorage.removeItem(key);
        cleared.push(`localStorage:${key}`);
      }
    }

    // Clear all sessionStorage (temporary data)
    const sessionCleared = clearSessionStorage();
    cleared.push(...sessionCleared.map(k => `sessionStorage:${k}`));

    console.log('✅ Smart cache refresh:', cleared.length, 'items');
  } catch (e) {
    console.error('❌ Smart cache refresh failed:', e);
  }

  return cleared;
}

/**
 * Check if cache is getting too large
 */
export function isCacheOversized(): boolean {
  try {
    const stats = getCacheStats();
    const threshold = 50; // Alert if more than 50 items in localStorage
    return stats.localStorage > threshold;
  } catch {
    return false;
  }
}

/**
 * Auto cleanup old cache entries
 */
export function autoCleanupOldCache(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): string[] {
  const cleared: string[] = [];
  const now = Date.now();

  try {
    // Check items with timestamps
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            if (parsed.timestamp && (now - parsed.timestamp) > maxAgeMs) {
              localStorage.removeItem(key);
              cleared.push(key);
            }
          }
        } catch {
          // Not JSON or no timestamp, skip
        }
      }
    }

    if (cleared.length > 0) {
      console.log('✅ Auto cleanup removed', cleared.length, 'old cache entries');
    }
  } catch (e) {
    console.error('❌ Auto cleanup failed:', e);
  }

  return cleared;
}

