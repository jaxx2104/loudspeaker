import { getRecentStars } from '../services/github.ts';
import { summarizeRepository } from '../services/summarizer.ts';
import { postToX } from '../services/twitter.ts';
import type { StarData } from '../types/index.ts';

export async function processStar(star: StarData): Promise<void> {
  const summary = await summarizeRepository(star);
  const message = `${summary}\n${star.url}`;
  await postToX(message);
  console.log(`Posted about star from ${star.repo}`);
}

export async function processRecentStars(): Promise<void> {
  const stars = await getRecentStars();

  for (const star of stars.reverse()) {
    await processStar(star);
  }
}
