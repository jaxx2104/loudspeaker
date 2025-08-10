import { getRecentStars } from './services/github.ts';
import { summarizeRepository } from './services/summarizer.ts';
import { postToX } from './services/twitter.ts';

async function main(): Promise<void> {
  try {
    // Get GitHub stars
    const stars = await getRecentStars();
    // console.log(stars);

    // Process new stars in chronological order (oldest first)
    for (const star of stars.reverse()) {
      // Create summary using LLM
      const summary = await summarizeRepository(star);
      const message = `${summary}\n${star.url}`;
      // Post to X
      await postToX(message);
      console.log(`Posted about star from ${star.repo}`);
    }
  } catch (error) {
    console.error('Error:', error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
