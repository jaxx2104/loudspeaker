import { mastra } from '../ai/agents.ts';
import type { GenerateOptions, Message, ModelType, StarData } from '../types/index.ts';
import { getWeightedLength, truncateAtSentenceBoundary } from '../core/tweet-utils.ts';

/** Strip noisy markdown chrome and cap length for prompt-friendliness. */
export function trimReadme(readme: string, maxChars = 1500): string {
  return readme
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // badge images
    .replace(/<!--[\s\S]*?-->/g, '') // HTML comments
    .replace(/```[\s\S]*?```/g, '') // fenced code blocks
    .replace(/\n{3,}/g, '\n\n') // collapse blank lines
    .trim()
    .slice(0, maxChars);
}

/** Validate, optionally retry once, and final-truncate the model's output. */
export async function processOutput(
  text: string,
  bodyBudget: number,
  retryFn: () => Promise<string>,
): Promise<string> {
  const trimmed = text.trim();
  if (trimmed.length < 10) {
    throw new Error(`Summary too short or empty (len=${trimmed.length})`);
  }
  if (getWeightedLength(trimmed) <= bodyBudget) return trimmed;

  const retried = (await retryFn()).trim();
  if (getWeightedLength(retried) <= bodyBudget) return retried;
  return truncateAtSentenceBoundary(retried, bodyBudget);
}

function buildUserMessage(star: StarData, bodyBudget: number): string {
  const readmeExcerpt = trimReadme(star.readme || '');
  return [
    '以下のリポジトリを日本語で要約してください。',
    '',
    `- repo: ${star.repo}`,
    `- 公式説明: ${star.description ?? '(なし)'}`,
    `- 主要言語: ${star.primaryLanguage}`,
    '- README 抜粋:',
    '---',
    readmeExcerpt || '(なし)',
    '---',
    '',
    '制約:',
    `- 日本語で ${bodyBudget} weighted 文字以内（X 換算で）`,
    '- 上記の「公式説明」「README 抜粋」に書かれている事実のみ使用',
    '- 技術名・製品名・略語は元の表記を一文字も変えない（例: "YOLOv7" を "Yeo7" にしない）',
    '- 出力に含めないもの: リポ名、URL、"I just starred"、ハッシュタグ、絵文字',
    '- 1〜2 文で、何ができる/何が新しいか を述べる',
  ].join('\n');
}

export async function summarizeRepository(
  repositoryData: StarData,
  bodyBudget: number,
  modelType: ModelType = 'openrouter',
): Promise<string> {
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

  const userMessage = buildUserMessage(repositoryData, bodyBudget);
  const messages: Message[] = [{ role: 'user', content: userMessage }];
  const options: GenerateOptions = { temperature: 0.3 };

  try {
    const result = await agent.generate(messages, options);
    const initialText = result.text ?? '';

    const retryFn = async (): Promise<string> => {
      const initialWeight = getWeightedLength(initialText.trim());
      const retryMessages: Message[] = [
        ...messages,
        { role: 'assistant', content: initialText.trim() },
        {
          role: 'user',
          content: `先ほどの出力は ${initialWeight} weighted 文字でした。` +
            `${bodyBudget} weighted 文字以内に短縮した日本語要約のみを返してください。`,
        },
      ];
      const retried = await agent.generate(retryMessages, options);
      return retried.text ?? '';
    };

    return await processOutput(initialText, bodyBudget, retryFn);
  } catch (error) {
    console.error(`Error in summarizeRepository with ${modelType}:`, error);

    if (modelType === 'openrouter') {
      console.log('Falling back to DeepSeek...');
      return summarizeRepository(repositoryData, bodyBudget, 'deepseek');
    } else if (modelType === 'deepseek') {
      console.log('Falling back to Mistral...');
      return summarizeRepository(repositoryData, bodyBudget, 'mistral');
    } else {
      console.error('All models failed, returning basic summary');
      return 'Unable to generate summary';
    }
  }
}
