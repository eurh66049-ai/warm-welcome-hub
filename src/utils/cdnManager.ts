/**
 * CDN Cache Manager — طبقة تخزين مؤقت ذكية للروابط والصور
 * تقلل الطلبات المتكررة وتحسن سرعة التحميل بشكل كبير
 */

const SUPABASE_STORAGE_BASE = 'https://kydmyxsgyxeubhmqzrgo.supabase.co/storage/v1/object/public/';

// In-memory URL cache to avoid redundant proxy URL computations
const urlCache = new Map<string, string>();
const MAX_CACHE_SIZE = 500;

// Preloaded image cache (browser-level)
const preloadedImages = new Set<string>();

/**
 * Get or compute a cached CDN URL for an image
 */
export const getCdnImageUrl = (
  originalUrl: string,
  type: 'cover' | 'avatar' | 'thumbnail' = 'cover'
): string => {
  if (!originalUrl) return originalUrl;

  const cacheKey = `${type}:${originalUrl}`;
  const cached = urlCache.get(cacheKey);
  if (cached) return cached;

  let result = originalUrl;

  if (originalUrl.includes(SUPABASE_STORAGE_BASE)) {
    const pathAfterBase = originalUrl.replace(SUPABASE_STORAGE_BASE, '');
    const [bucket, ...pathParts] = pathAfterBase.split('/');
    const filePath = pathParts.join('/');

    if (bucket && filePath) {
      const params = new URLSearchParams({ format: 'webp', quality: '45' });

      switch (type) {
        case 'cover':
          params.set('width', '200');
          params.set('height', '300');
          params.set('resize', 'cover');
          break;
        case 'avatar':
          params.set('width', '64');
          params.set('height', '64');
          params.set('resize', 'cover');
          break;
        case 'thumbnail':
          params.set('width', '120');
          params.set('height', '180');
          params.set('resize', 'cover');
          break;
      }

      result = `/i/${bucket}/${filePath}?${params.toString()}`;
    }
  }

  // Evict oldest entries if cache is full
  if (urlCache.size >= MAX_CACHE_SIZE) {
    const firstKey = urlCache.keys().next().value;
    if (firstKey) urlCache.delete(firstKey);
  }
  urlCache.set(cacheKey, result);

  return result;
};

/**
 * Get CDN URL for a PDF file
 */
export const getCdnFileUrl = (originalUrl: string): string => {
  if (!originalUrl) return originalUrl;

  const cacheKey = `file:${originalUrl}`;
  const cached = urlCache.get(cacheKey);
  if (cached) return cached;

  let result = originalUrl;

  if (originalUrl.includes(SUPABASE_STORAGE_BASE)) {
    const pathAfterBase = originalUrl.replace(SUPABASE_STORAGE_BASE, '');
    const [bucket, ...pathParts] = pathAfterBase.split('/');
    const filePath = pathParts.join('/');

    if (bucket && filePath) {
      result = `/f/${bucket}/${filePath}`;
    }
  }

  if (urlCache.size >= MAX_CACHE_SIZE) {
    const firstKey = urlCache.keys().next().value;
    if (firstKey) urlCache.delete(firstKey);
  }
  urlCache.set(cacheKey, result);

  return result;
};

/**
 * Preload critical images (above-the-fold covers)
 */
export const preloadImages = (urls: string[], type: 'cover' | 'avatar' = 'cover') => {
  const toPreload = urls
    .slice(0, 6) // Only preload first 6
    .map(url => getCdnImageUrl(url, type))
    .filter(url => !preloadedImages.has(url));

  toPreload.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    link.type = 'image/webp';
    document.head.appendChild(link);
    preloadedImages.add(url);
  });
};

/**
 * Clear the URL cache (useful on logout or major state changes)
 */
export const clearCdnCache = () => {
  urlCache.clear();
  preloadedImages.clear();
};

/**
 * Get cache stats for debugging
 */
export const getCdnCacheStats = () => ({
  urlCacheSize: urlCache.size,
  preloadedCount: preloadedImages.size,
  maxCacheSize: MAX_CACHE_SIZE,
});
