import type { StarData } from '../types/index.ts';

// Cache file path - can be overridden via environment variable for GitHub Actions cache
const CACHE_FILE_PATH = Deno.env.get('PROCESSED_STARS_CACHE') || '.processed-stars.json';

// How long to keep processed star records (24 hours)
const RETENTION_HOURS = 24;

interface ProcessedStar {
  url: string;
  processedAt: string;
}

interface CacheData {
  processedStars: ProcessedStar[];
}

async function loadCache(): Promise<CacheData> {
  try {
    const content = await Deno.readTextFile(CACHE_FILE_PATH);
    const data = JSON.parse(content) as CacheData;
    console.log(`[Cache] Loaded ${data.processedStars.length} processed stars from cache`);
    return data;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.log('[Cache] No existing cache file found, starting fresh');
      return { processedStars: [] };
    }
    console.error('[Cache] Error loading cache, starting fresh:', error);
    return { processedStars: [] };
  }
}

async function saveCache(data: CacheData): Promise<void> {
  try {
    await Deno.writeTextFile(CACHE_FILE_PATH, JSON.stringify(data, null, 2));
    console.log(`[Cache] Saved ${data.processedStars.length} processed stars to cache`);
  } catch (error) {
    console.error('[Cache] Error saving cache:', error);
  }
}

function cleanupOldEntries(data: CacheData): CacheData {
  const cutoffTime = new Date(Date.now() - RETENTION_HOURS * 60 * 60 * 1000);
  const before = data.processedStars.length;

  data.processedStars = data.processedStars.filter((star) => {
    const processedAt = new Date(star.processedAt);
    return processedAt > cutoffTime;
  });

  const removed = before - data.processedStars.length;
  if (removed > 0) {
    console.log(`[Cache] Cleaned up ${removed} old entries (older than ${RETENTION_HOURS} hours)`);
  }

  return data;
}

export async function isStarProcessed(star: StarData): Promise<boolean> {
  const cache = await loadCache();
  const isProcessed = cache.processedStars.some((s) => s.url === star.url);
  if (isProcessed) {
    console.log(`[Cache] Star ${star.repo} was already processed, skipping`);
  }
  return isProcessed;
}

export async function markStarAsProcessed(star: StarData): Promise<void> {
  let cache = await loadCache();

  // Add new entry
  cache.processedStars.push({
    url: star.url,
    processedAt: new Date().toISOString(),
  });

  // Clean up old entries
  cache = cleanupOldEntries(cache);

  await saveCache(cache);
  console.log(`[Cache] Marked ${star.repo} as processed`);
}

export async function filterUnprocessedStars(stars: StarData[]): Promise<StarData[]> {
  const cache = await loadCache();
  const processedUrls = new Set(cache.processedStars.map((s) => s.url));

  const unprocessed = stars.filter((star) => !processedUrls.has(star.url));

  console.log(`[Cache] Filtered stars: ${stars.length} total, ${unprocessed.length} unprocessed, ${stars.length - unprocessed.length} already processed`);

  return unprocessed;
}
