import { getRecentStars } from '../services/github.ts';
import { summarizeRepository } from '../services/summarizer.ts';
import { postToX } from '../services/twitter.ts';
import {
  filterUnprocessedStars,
  markStarAsProcessed,
} from '../services/processed-stars.ts';
import type { StarData } from '../types/index.ts';

export interface ProcessingResult {
  total: number;
  processed: number;
  skipped: number;
  failed: number;
  errors: Array<{ repo: string; error: string }>;
}

export async function processStar(star: StarData): Promise<void> {
  console.log(`[Processor] Starting to process: ${star.repo}`);

  console.log(`[Processor] Generating AI summary for ${star.repo}...`);
  const summary = await summarizeRepository(star);
  console.log(`[Processor] Summary generated (${summary.length} chars)`);

  const message = `${summary}\n${star.url}`;
  console.log(`[Processor] Posting to X...`);
  await postToX(message);

  console.log(`[Processor] Successfully posted about ${star.repo}`);
}

export async function processRecentStars(): Promise<ProcessingResult> {
  console.log('[Processor] ========================================');
  console.log('[Processor] Starting star processing run');
  console.log(`[Processor] Run started at: ${new Date().toISOString()}`);
  console.log('[Processor] ========================================');

  const result: ProcessingResult = {
    total: 0,
    processed: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  // Fetch recent stars
  const allStars = await getRecentStars();
  result.total = allStars.length;

  if (allStars.length === 0) {
    console.log('[Processor] No recent stars found in time window');
    return result;
  }

  // Filter out already processed stars
  const unprocessedStars = await filterUnprocessedStars(allStars);
  result.skipped = allStars.length - unprocessedStars.length;

  if (unprocessedStars.length === 0) {
    console.log('[Processor] All stars have already been processed');
    return result;
  }

  console.log(`[Processor] Processing ${unprocessedStars.length} new stars...`);

  // Process in reverse chronological order (oldest first for proper timeline)
  for (const star of unprocessedStars.reverse()) {
    try {
      await processStar(star);
      await markStarAsProcessed(star);
      result.processed++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Processor] Failed to process ${star.repo}: ${errorMessage}`);
      result.failed++;
      result.errors.push({ repo: star.repo, error: errorMessage });
      // Continue processing remaining stars even if one fails
    }
  }

  // Summary log
  console.log('[Processor] ========================================');
  console.log('[Processor] Processing run completed');
  console.log(`[Processor] Total stars in window: ${result.total}`);
  console.log(`[Processor] Skipped (already processed): ${result.skipped}`);
  console.log(`[Processor] Successfully processed: ${result.processed}`);
  console.log(`[Processor] Failed: ${result.failed}`);
  if (result.errors.length > 0) {
    console.log('[Processor] Errors:');
    for (const err of result.errors) {
      console.log(`[Processor]   - ${err.repo}: ${err.error}`);
    }
  }
  console.log('[Processor] ========================================');

  return result;
}
