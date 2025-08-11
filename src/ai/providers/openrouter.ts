import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { config } from '../../config/env.ts';

export const openrouter = createOpenRouter({
  apiKey: config.openrouter.apiKey,
});
