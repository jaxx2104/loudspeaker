import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatMistralAI } from '@langchain/mistralai';
import { ChatDeepSeek } from '@langchain/deepseek';
import { config } from '../config/env.js';

// 共通のプロンプトテンプレート
const prompt = ChatPromptTemplate.fromMessages([
  ["system", config.systemPrompt],
  ["user", "以下のGitHubリポジトリの説明を20文字以内で簡潔かつ利点が伝わるように要約してください。説明: {description}"]
]);

// Mistral AIの設定
const mistralModel = new ChatMistralAI({
  apiKey: config.mistral.apiKey,
  modelName: 'mistral-tiny', // 最も安価なモデル
  temperature: 0.3,
});

// DeepSeek AIの設定
const deepseekModel = new ChatDeepSeek({
  apiKey: config.deepseek.apiKey,
  modelName: 'deepseek-chat', // DeepSeekのチャットモデル
  temperature: 0.3,
});

// モデル選択関数
const getModel = (modelType) => {
  switch (modelType) {
    case 'deepseek':
      return deepseekModel;
    case 'mistral':
    default:
      return mistralModel;
  }
};

export async function summarizeDescription(description, modelType = 'deepseek') {
  try {
    const model = getModel(modelType);
    const chain = prompt.pipe(model);
    const result = await chain.invoke({
      description: description || "No description provided"
    });
    return result.content ? ` - ${result.content}` : '';
  } catch (error) {
    console.error(`Error in summarizeDescription:`, error);
    summarizeDescription(description, 'mistral')
    return '';
  }
}
