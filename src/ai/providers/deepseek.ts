import { createDeepSeek } from '@ai-sdk/deepseek';
import { config } from '../../config/env.ts';

export const deepseek = createDeepSeek({
  apiKey: config.deepseek.apiKey,
});
