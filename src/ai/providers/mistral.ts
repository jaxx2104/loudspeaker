import { createMistral } from '@ai-sdk/mistral';
import { config } from '../../config/env.ts';

export const mistral = createMistral({
  apiKey: config.mistral.apiKey,
});
