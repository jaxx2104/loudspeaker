import { processRecentStars } from './core/processor.ts';

async function main(): Promise<void> {
  try {
    await processRecentStars();
  } catch (error) {
    console.error('Error:', error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
