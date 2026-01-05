import { processRecentStars } from './core/processor.ts';

async function main(): Promise<void> {
  console.log('[Main] Loudspeaker starting...');
  console.log(`[Main] Version: 1.1.0`);
  console.log(`[Main] Time: ${new Date().toISOString()}`);

  try {
    const result = await processRecentStars();

    // Exit with error if all stars failed
    if (result.total > 0 && result.processed === 0 && result.failed > 0) {
      console.error('[Main] All stars failed to process');
      Deno.exit(1);
    }

    // Log final status
    if (result.failed > 0) {
      console.warn(`[Main] Completed with ${result.failed} failure(s)`);
    } else {
      console.log('[Main] Completed successfully');
    }
  } catch (error) {
    console.error('[Main] Fatal error:', error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
