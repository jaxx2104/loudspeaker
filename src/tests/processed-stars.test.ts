import { afterAll, beforeEach, describe, expect, it } from 'bun:test';
import { readFile, rm } from 'node:fs/promises';
import {
  filterUnprocessedStars,
  isStarProcessed,
  markStarAsProcessed,
} from '../services/processed-stars.ts';
import type { StarData } from '../types/index.ts';

const cachePath = process.env.PROCESSED_STARS_CACHE as string;

const star: StarData = {
  repo: 'cache-test/repo',
  description: null,
  url: 'https://github.com/cache-test/repo',
  primaryLanguage: 'TypeScript',
  readme: '',
  starredAt: new Date(),
};

describe('processed-stars cache', () => {
  beforeEach(async () => {
    await rm(cachePath, { force: true });
  });

  afterAll(async () => {
    await rm(cachePath, { force: true });
  });

  it('treats a missing cache file as empty', async () => {
    expect(await isStarProcessed(star)).toBe(false);
  });

  it('persists processed stars to the cache file', async () => {
    await markStarAsProcessed(star);

    expect(await isStarProcessed(star)).toBe(true);
    const saved = JSON.parse(await readFile(cachePath, 'utf8'));
    expect(saved.processedStars).toHaveLength(1);
    expect(saved.processedStars[0].url).toBe(star.url);
  });

  it('filters out already processed stars', async () => {
    await markStarAsProcessed(star);
    const other: StarData = {
      ...star,
      repo: 'cache-test/other',
      url: 'https://github.com/cache-test/other',
    };

    const result = await filterUnprocessedStars([star, other]);

    expect(result).toEqual([other]);
  });
});
