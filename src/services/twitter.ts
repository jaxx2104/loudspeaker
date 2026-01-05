import { TwitterApi } from 'twitter-api-v2';
import { config } from '../config/env.ts';

// X client initialization
const twitterClient = new TwitterApi({
  appKey: config.twitter.apiKey,
  appSecret: config.twitter.apiSecret,
  accessToken: config.twitter.accessToken,
  accessSecret: config.twitter.accessSecret,
});

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 2000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function postToX(message: string): Promise<void> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[Twitter] Attempting to post tweet (attempt ${attempt}/${MAX_RETRIES})`);
      await twitterClient.v2.tweet(message);
      console.log('[Twitter] Tweet posted successfully');
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[Twitter] Attempt ${attempt} failed: ${lastError.message}`);

      // Don't retry on certain errors (duplicate tweet, auth errors)
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (
          errorMessage.includes('duplicate') ||
          errorMessage.includes('unauthorized') ||
          errorMessage.includes('forbidden')
        ) {
          console.error('[Twitter] Non-retryable error, stopping retry attempts');
          throw error;
        }
      }

      if (attempt < MAX_RETRIES) {
        const delay = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`[Twitter] Waiting ${delay}ms before retry...`);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error('Failed to post tweet after all retries');
}
