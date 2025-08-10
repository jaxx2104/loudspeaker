import { Agent } from '@mastra/core/agent';
import { Mastra } from '@mastra/core';
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createMistral } from '@ai-sdk/mistral';
import { config } from '../config/env.js';

const openrouter = createOpenRouter({
  apiKey: config.openrouter.apiKey,
})
const deepseek = createDeepSeek({
  apiKey: config.deepseek.apiKey,
});
const mistral = createMistral({
  apiKey: config.mistral.apiKey,
});

// OpenRouterエージェント（プライマリ）
const openrouterAgent = new Agent({
  name: 'openrouterAgent',
  instructions: config.systemPrompt,
  model: openrouter('openai/gpt-5-nano'),
});

// DeepSeekエージェント（フォールバック1）
const deepseekAgent = new Agent({
  name: 'deepseekAgent',
  instructions: config.systemPrompt,
  model: deepseek('deepseek-chat'),
});

// Mistralエージェント（フォールバック2）
const mistralAgent = new Agent({
  name: 'mistralAgent',
  instructions: config.systemPrompt,
  model: mistral('mistral-tiny'),
});

// Mastra インスタンスの設定
const mastra = new Mastra({
  agents: { 
    openrouterAgent, 
    deepseekAgent, 
    mistralAgent 
  },
  telemetry: {
    enabled: false,
  },
});

export async function summarizeRepository(repositoryData, modelType = 'openrouter') {
  const prompt = `
- repo: ${repositoryData.repo || "Unknown Repository"}
- primaryLanguage: ${repositoryData.primaryLanguage || "Unknown Technology"}
- readme: ${repositoryData.readme || "No README provided"}
`;

  const messages = [{ role: "user", content: prompt }];
  const options = { temperature: 0.3 };

  try {
    // フォールバック順序: OpenRouter -> DeepSeek -> Mistral
    if (modelType === 'openrouter') {
      const agent = mastra.getAgent('openrouterAgent');
      const result = await agent.generate(messages, options);
      return result.text;
    } else if (modelType === 'deepseek') {
      const agent = mastra.getAgent('deepseekAgent');
      const result = await agent.generate(messages, options);
      return result.text;
    } else {
      const agent = mastra.getAgent('mistralAgent');
      const result = await agent.generate(messages, options);
      return result.text;
    }
  } catch (error) {
    console.error(`Error in summarizeRepository with ${modelType}:`, error);
    
    // フォールバック順序: OpenRouter -> DeepSeek -> Mistral
    if (modelType === 'openrouter') {
      console.log('Falling back to DeepSeek...');
      return summarizeRepository(repositoryData, 'deepseek');
    } else if (modelType === 'deepseek') {
      console.log('Falling back to Mistral...');
      return summarizeRepository(repositoryData, 'mistral');
    } else {
      // 失敗した場合は基本的なエラーメッセージを返す
      console.error('All models failed, returning basic summary');
      return `I just starred ${repositoryData.repo || "Unknown Repository"} - Unable to generate summary`;
    }
  }
}
