import { useCallback } from 'react';

interface CacheEntry {
  url: string;
  timestamp: number;
  success: boolean;
  retryCount: number;
}

interface ImageCache {
  [isbn: string]: CacheEntry;
}

export const useImageCache = () => {
  const CACHE_KEY = 'goodstats_image_cache';
  const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
  const MAX_RETRIES = 3;

  const getCache = useCallback((): ImageCache => {
    try {
      const cache = localStorage.getItem(CACHE_KEY);
      return cache ? JSON.parse(cache) : {};
    } catch (error) {
      console.error('Failed to read image cache:', error);
      return {};
    }
  }, []);

  const setCache = useCallback((cache: ImageCache) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Failed to write to image cache:', error);
    }
  }, []);

  const cleanCache = useCallback(() => {
    const cache = getCache();
    const now = Date.now();
    let hasChanges = false;

    Object.entries(cache).forEach(([isbn, entry]) => {
      if (now - entry.timestamp > CACHE_DURATION) {
        delete cache[isbn];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setCache(cache);
    }
  }, [getCache, setCache]);

  const getCachedUrl = useCallback((isbn: string): CacheEntry | null => {
    const cache = getCache();
    const entry = cache[isbn];
    
    if (!entry) return null;
    
    // Check if cache entry is expired
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      delete cache[isbn];
      setCache(cache);
      return null;
    }
    
    return entry;
  }, [getCache, setCache]);

  const updateCache = useCallback((isbn: string, success: boolean) => {
    const cache = getCache();
    const entry = cache[isbn] || { retryCount: 0 };
    
    cache[isbn] = {
      url: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
      timestamp: Date.now(),
      success,
      retryCount: success ? 0 : entry.retryCount + 1
    };
    
    setCache(cache);

    // Clean cache periodically (1% chance on each update)
    if (Math.random() < 0.01) {
      cleanCache();
    }
  }, [getCache, setCache, cleanCache]);

  const shouldRetry = useCallback((isbn: string): boolean => {
    const entry = getCachedUrl(isbn);
    return !entry || (!entry.success && entry.retryCount < MAX_RETRIES);
  }, [getCachedUrl]);

  return {
    getCachedUrl,
    updateCache,
    shouldRetry,
    cleanCache
  };
}; 