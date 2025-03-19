import 'dotenv/config';
import { getRecentStars } from './services/github.js';
import { summarizeRepository } from './services/summarizer.js';
import { postToX } from './services/twitter.js';

async function main() {
  try {
    // GitHub Star の取得
    const stars = await getRecentStars();
    console.log(stars);

    // 新しい Star を古い順に処理
    for (const star of stars.reverse()) {
      // LLM によって要約を作成
      const summary = await summarizeRepository(star);
      const message = `I just starred ${star.repo}${summary}\n${star.url}`;
      // X に投稿
      await postToX(message);
      console.log(`Posted about star from ${star.repo}`);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
