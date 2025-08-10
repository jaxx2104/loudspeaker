import { Agent } from '@mastra/core/agent';
import { Mastra } from '@mastra/core';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createMistral } from '@ai-sdk/mistral';
import { config } from '../config/env.ts';
import type { GenerateOptions, Message, ModelType, StarData } from '../types.ts';

const openrouter = createOpenRouter({
  apiKey: config.openrouter.apiKey,
});

const deepseek = createDeepSeek({
  apiKey: config.deepseek.apiKey,
});

const mistral = createMistral({
  apiKey: config.mistral.apiKey,
});

// OpenRouter agent (primary)
const openrouterAgent = new Agent({
  name: 'openrouterAgent',
  instructions: config.systemPrompt,
  model: openrouter('openai/gpt-5-nano'),
});

// DeepSeek agent (fallback 1)
const deepseekAgent = new Agent({
  name: 'deepseekAgent',
  instructions: config.systemPrompt,
  model: deepseek('deepseek-chat'),
});

// Mistral agent (fallback 2)
const mistralAgent = new Agent({
  name: 'mistralAgent',
  instructions: config.systemPrompt,
  model: mistral('mistral-tiny'),
});

// Mastra instance configuration
const mastra = new Mastra({
  agents: {
    openrouterAgent,
    deepseekAgent,
    mistralAgent,
  },
  telemetry: {
    enabled: false,
  },
});

export async function summarizeRepository(
  repositoryData: StarData,
  modelType: ModelType = 'openrouter',
): Promise<string> {
  const prompt = `
- repo: ${repositoryData.repo || 'Unknown Repository'}
- primaryLanguage: ${repositoryData.primaryLanguage || 'Unknown Technology'}
- readme: ${repositoryData.readme || 'No README provided'}
`;

  const messages: Message[] = [{ role: 'user', content: prompt }];
  const options: GenerateOptions = { temperature: 0.3 };

  try {
    // Fallback order: OpenRouter -> DeepSeek -> Mistral
    let agent;
    switch (modelType) {
      case 'openrouter':
        agent = mastra.getAgent('openrouterAgent');
        break;
      case 'deepseek':
        agent = mastra.getAgent('deepseekAgent');
        break;
      case 'mistral':
        agent = mastra.getAgent('mistralAgent');
        break;
      default:
        agent = mastra.getAgent('openrouterAgent');
    }

    const result = await agent.generate(messages, options);
    return result.text;
  } catch (error) {
    console.error(`Error in summarizeRepository with ${modelType}:`, error);

    // Fallback chain: OpenRouter -> DeepSeek -> Mistral
    if (modelType === 'openrouter') {
      console.log('Falling back to DeepSeek...');
      return summarizeRepository(repositoryData, 'deepseek');
    } else if (modelType === 'deepseek') {
      console.log('Falling back to Mistral...');
      return summarizeRepository(repositoryData, 'mistral');
    } else {
      // If all models fail, return basic error message
      console.error('All models failed, returning basic summary');
      return `I just starred ${
        repositoryData.repo || 'Unknown Repository'
      } - Unable to generate summary`;
    }
  }
}
