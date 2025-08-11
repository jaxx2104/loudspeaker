import { Agent } from '@mastra/core/agent';
import { Mastra } from '@mastra/core';
import { openrouter } from './providers/openrouter.ts';
import { deepseek } from './providers/deepseek.ts';
import { mistral } from './providers/mistral.ts';
import { config } from '../config/env.ts';

export const openrouterAgent = new Agent({
  name: 'openrouterAgent',
  instructions: config.systemPrompt,
  model: openrouter('openai/gpt-5-nano'),
});

export const deepseekAgent = new Agent({
  name: 'deepseekAgent',
  instructions: config.systemPrompt,
  model: deepseek('deepseek-chat'),
});

export const mistralAgent = new Agent({
  name: 'mistralAgent',
  instructions: config.systemPrompt,
  model: mistral('mistral-tiny'),
});

export const mastra = new Mastra({
  agents: {
    openrouterAgent,
    deepseekAgent,
    mistralAgent,
  },
  telemetry: {
    enabled: false,
  },
});
