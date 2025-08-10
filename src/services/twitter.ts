import { TwitterApi } from 'twitter-api-v2';
import { config } from '../config/env.ts';

// X client initialization
const twitterClient = new TwitterApi({
  appKey: config.twitter.apiKey,
  appSecret: config.twitter.apiSecret,
  accessToken: config.twitter.accessToken,
  accessSecret: config.twitter.accessSecret,
});

export async function postToX(message: string): Promise<void> {
  await twitterClient.v2.tweet(message);
}
