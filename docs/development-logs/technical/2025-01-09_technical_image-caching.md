# Image URL Caching Implementation

## Overview
Implementation of a caching system for book cover images to reduce 404 errors and improve loading performance.

## Technical Design

### 1. Cache Storage
```typescript
interface CacheEntry {
  url: string;
  timestamp: number;
  success: boolean;
  retryCount: number;
}

interface ImageCache {
  [isbn: string]: CacheEntry;
}
```

### 2. Cache Management Hook
```typescript
const useImageCache = () => {
  const CACHE_KEY = 'goodstats_image_cache';
  const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
  const MAX_RETRIES = 3;

  const getCache = useCallback((): ImageCache => {
    const cache = localStorage.getItem(CACHE_KEY);
    return cache ? JSON.parse(cache) : {};
  }, []);

  const setCache = useCallback((cache: ImageCache) => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  }, []);

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
  }, [getCache, setCache]);

  const shouldRetry = useCallback((isbn: string): boolean => {
    const entry = getCachedUrl(isbn);
    return !entry || (!entry.success && entry.retryCount < MAX_RETRIES);
  }, [getCachedUrl]);

  return {
    getCachedUrl,
    updateCache,
    shouldRetry
  };
};
```

### 3. Integration with BookCard
```typescript
const BookCard = ({ book }: { book: Book }) => {
  const { getCachedUrl, updateCache, shouldRetry } = useImageCache();
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadImage = async () => {
      if (!book.isbn) {
        setImageUrl(getBookCoverUrl(book));
        return;
      }

      const cachedEntry = getCachedUrl(book.isbn);
      
      if (cachedEntry && cachedEntry.success) {
        setImageUrl(cachedEntry.url);
        return;
      }

      if (!shouldRetry(book.isbn)) {
        setImageError(true);
        return;
      }

      const url = getBookCoverUrl(book);
      setImageUrl(url);
    };

    loadImage();
  }, [book, getCachedUrl, shouldRetry]);

  const handleImageError = () => {
    if (book.isbn) {
      updateCache(book.isbn, false);
    }
    setImageError(true);
  };

  const handleImageLoad = () => {
    if (book.isbn) {
      updateCache(book.isbn, true);
    }
  };

  // ... rest of component
};
```

## Implementation Steps
1. [ ] Create cache management hook
2. [ ] Add cache integration to BookCard
3. [ ] Implement cache cleanup
4. [ ] Add monitoring
5. [ ] Test cache behavior

## Testing Strategy
1. Unit Tests
   - Cache management functions
   - Expiration logic
   - Retry mechanism

2. Integration Tests
   - BookCard with cache
   - Error handling
   - Cache persistence

3. Performance Tests
   - Load time improvements
   - Memory usage
   - Cache hit rate

## Monitoring
1. Metrics to Track
   - Cache hit rate
   - Error reduction
   - Load time improvement

2. Error Tracking
   - Failed loads
   - Cache failures
   - Invalid entries

## Rollout Plan
1. Development
   - Implement core functionality
   - Add tests
   - Local testing

2. Testing
   - Developer testing
   - Performance validation
   - Error handling verification

3. Production
   - Gradual rollout
   - Monitor metrics
   - Gather feedback 