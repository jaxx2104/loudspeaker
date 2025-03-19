import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatMistralAI } from '@langchain/mistralai';
import { ChatDeepSeek } from '@langchain/deepseek';
import { config } from '../config/env.js';

// 新しいプロンプトテンプレート
const prompt = ChatPromptTemplate.fromMessages([
  ["system", config.systemPrompt],
  ["user", `以下のGitHubリポジトリ情報を50文字以内で要約してください。
リポジトリ名: {repo}
主要技術: {primaryLanguage}
README: {readme}

フォーマット: I just starred リポジトリ名 - [READMEの要約]`]
]);

// Mistral AIの設定
const mistralModel = new ChatMistralAI({
  apiKey: config.mistral.apiKey,
  modelName: 'mistral-tiny',
  temperature: 0.3,
});

// DeepSeek AIの設定
const deepseekModel = new ChatDeepSeek({
  apiKey: config.deepseek.apiKey,
  modelName: 'deepseek-chat',
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

export async function summarizeRepository(repositoryData, modelType = 'deepseek') {
  try {
    const model = getModel(modelType);
    const chain = prompt.pipe(model);
    
    const result = await chain.invoke({
      repo: repositoryData.repo || "Unknown Repository",
      primaryLanguage: repositoryData.primaryLanguage || "Unknown Technology",
      readme: repositoryData.readme || "No README provided"
    });
    
    return result.content;
  } catch (error) {
    console.error(`Error in summarizeRepository:`, error);
    // フォールバックとしてMistralを使用
    return summarizeRepository(repositoryData, 'mistral');
  }
}
