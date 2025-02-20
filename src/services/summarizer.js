import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatMistralAI } from '@langchain/mistralai';
import { config } from '../config/env.js';

// LangChainの設定
const model = new ChatMistralAI({
  apiKey: config.mistral.apiKey,
  modelName: 'mistral-tiny', // 最も安価なモデル
  temperature: 0.3,
});

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "あなたは優秀なWEBエンジニアです。必ず日本語で要約してください"],
  ["user", "以下のGitHubリポジトリの説明を15文字以内で簡潔に要約してください。説明: {description}"]
]);

export async function summarizeDescription(description) {
  try {
    const chain = prompt.pipe(model);
    const result = await chain.invoke({
      description: description || "No description provided"
    });
    return result.content ? ` - ${result.content}` : '';
  } catch (error) {
    console.error("Error in summarizeDescription:", error);
    return '';
  }
}
