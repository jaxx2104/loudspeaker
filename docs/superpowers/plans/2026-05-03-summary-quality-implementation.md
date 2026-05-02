# Summary Quality Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the design from `docs/superpowers/specs/2026-05-03-summary-quality-design.md` — ground summaries in `description`, communicate explicit budget, sentence-boundary truncate, refresh model IDs.

**Architecture:** New pure helpers do all the testable work (`truncateAtSentenceBoundary`, `trimReadme`, `processOutput`, `buildPostMessage`, `computeBodyBudget`). `summarizeRepository` becomes a thin wrapper that wires the helpers around the Mastra agent call. `processor.ts` builds tweets from a fixed prefix template with a dynamically computed body budget. Three model identifier strings are updated.

**Tech Stack:** Deno, TypeScript, Mastra, AI SDK (OpenRouter / DeepSeek / Mistral), `@std/assert`, `@std/testing/bdd`.

---

## File Structure

| File                            | Status | Responsibility                                                                                                      |
| ------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------- |
| `src/core/tweet-utils.ts`       | modify | Add `truncateAtSentenceBoundary`. Remove unused `MAX_SUMMARY_WEIGHT` (Task 7).                                      |
| `src/services/summarizer.ts`    | modify | Add `trimReadme`, `processOutput`, `buildUserMessage`. Update `summarizeRepository` signature to take `bodyBudget`. |
| `src/core/processor.ts`         | modify | Add `computeBodyBudget`, `buildPostMessage` helpers. Use code-side prefix template, no truncation here.             |
| `src/ai/agents.ts`              | modify | Update three model identifier strings.                                                                              |
| `src/tests/tweet-utils.test.ts` | create | Unit tests for `truncateAtSentenceBoundary`.                                                                        |
| `src/tests/services.test.ts`    | modify | Add tests for `trimReadme`, `processOutput`.                                                                        |
| `src/tests/core.test.ts`        | modify | Add tests for `computeBodyBudget`, `buildPostMessage`.                                                              |

---

## Task 1: Add `truncateAtSentenceBoundary`

**Files:**

- Create: `src/tests/tweet-utils.test.ts`
- Modify: `src/core/tweet-utils.ts`

- [ ] **Step 1: Write failing tests**

Create `src/tests/tweet-utils.test.ts`:

```typescript
import { assertEquals } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import { getWeightedLength, truncateAtSentenceBoundary } from '../core/tweet-utils.ts';

describe('truncateAtSentenceBoundary', () => {
  it('returns text unchanged when within budget', () => {
    assertEquals(truncateAtSentenceBoundary('hello', 10), 'hello');
  });

  it('cuts at the last "。" within budget', () => {
    // 「これは最初の文です。」 = 10 chars × 2 = 20 weighted
    const text = 'これは最初の文です。これは二番目の文です。';
    const result = truncateAtSentenceBoundary(text, 22);
    assertEquals(result, 'これは最初の文です。');
  });

  it('cuts at "！" when present', () => {
    const text = 'すごい！次の文。';
    const result = truncateAtSentenceBoundary(text, 8);
    assertEquals(result, 'すごい！');
  });

  it('falls back to ellipsis when no sentence-ender within budget', () => {
    const text = 'abcdefghijklmnop';
    const result = truncateAtSentenceBoundary(text, 8);
    assertEquals(result.endsWith('…'), true);
    assertEquals(getWeightedLength(result) <= 8, true);
  });

  it('handles full-width characters correctly', () => {
    // ＡＢＣ。 = 4 chars × 2 = 8 weighted
    const text = 'ＡＢＣ。ＤＥＦ。';
    const result = truncateAtSentenceBoundary(text, 9);
    assertEquals(result, 'ＡＢＣ。');
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `deno test --allow-net --allow-env --allow-read src/tests/tweet-utils.test.ts`
Expected: FAIL with "truncateAtSentenceBoundary is not exported" (or similar import error).

- [ ] **Step 3: Implement the function**

Append to `src/core/tweet-utils.ts` (after `truncateToWeightedLength`):

```typescript
const SENTENCE_ENDERS = new Set(['。', '．', '！', '？', '!', '?', '\n']);

/** Truncate text at the last sentence-ender within the weighted budget. */
export function truncateAtSentenceBoundary(
  text: string,
  maxWeight: number,
): string {
  if (getWeightedLength(text) <= maxWeight) return text;

  let weight = 0;
  let byteIndex = 0;
  let bestCutAt = -1;

  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    const charWeight = isDoubleWeightChar(code) ? 2 : 1;
    if (weight + charWeight > maxWeight) break;
    weight += charWeight;
    byteIndex += char.length;
    if (SENTENCE_ENDERS.has(char)) {
      bestCutAt = byteIndex;
    }
  }

  if (bestCutAt > 0) return text.slice(0, bestCutAt);
  return truncateToWeightedLength(text, maxWeight);
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `deno test --allow-net --allow-env --allow-read src/tests/tweet-utils.test.ts`
Expected: 5 tests PASS.

- [ ] **Step 5: Lint + format**

Run: `deno task fmt && deno task lint && deno task check`
Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add src/core/tweet-utils.ts src/tests/tweet-utils.test.ts
git commit -m "feat(tweet-utils): add truncateAtSentenceBoundary helper"
```

---

## Task 2: Add `trimReadme` helper

**Files:**

- Modify: `src/services/summarizer.ts`
- Modify: `src/tests/services.test.ts`

- [ ] **Step 1: Write failing tests**

Add to `src/tests/services.test.ts` — first, add the import at the top with the existing imports:

```typescript
import { trimReadme } from '../services/summarizer.ts';
```

Then add at the end of the file (a new top-level `describe` block, outside `describe('Services')`):

````typescript
describe('trimReadme', () => {
  it('removes badge images', () => {
    const input = 'Hello ![badge](https://img.shields.io/x.svg) world';
    assertEquals(trimReadme(input), 'Hello  world');
  });

  it('removes HTML comments', () => {
    const input = '<!-- hidden -->visible';
    assertEquals(trimReadme(input), 'visible');
  });

  it('removes fenced code blocks', () => {
    const input = 'before\n```ts\nconst x = 1;\n```\nafter';
    const result = trimReadme(input);
    assertEquals(result.includes('const x'), false);
    assertEquals(result.includes('before'), true);
    assertEquals(result.includes('after'), true);
  });

  it('caps length at maxChars', () => {
    const input = 'a'.repeat(2000);
    assertEquals(trimReadme(input, 1500).length, 1500);
  });

  it('handles empty string', () => {
    assertEquals(trimReadme(''), '');
  });
});
````

- [ ] **Step 2: Run tests to verify failure**

Run: `deno test --allow-net --allow-env --allow-read src/tests/services.test.ts`
Expected: FAIL — `trimReadme` not exported.

- [ ] **Step 3: Implement `trimReadme`**

Add to the top of `src/services/summarizer.ts` (before `summarizeRepository`):

````typescript
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
````

- [ ] **Step 4: Run tests to verify pass**

Run: `deno test --allow-net --allow-env --allow-read src/tests/services.test.ts`
Expected: 5 new tests PASS, all existing tests still PASS.

- [ ] **Step 5: Lint + format**

Run: `deno task fmt && deno task lint && deno task check`
Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add src/services/summarizer.ts src/tests/services.test.ts
git commit -m "feat(summarizer): add trimReadme helper for prompt curation"
```

---

## Task 3: Add `processOutput` validation/retry helper

**Files:**

- Modify: `src/services/summarizer.ts`
- Modify: `src/tests/services.test.ts`

- [ ] **Step 1: Write failing tests**

Add to `src/tests/services.test.ts` — extend the imports to include `processOutput` and `getWeightedLength`:

```typescript
import { processOutput, trimReadme } from '../services/summarizer.ts';
import { getWeightedLength } from '../core/tweet-utils.ts';
```

Then add a new top-level `describe`:

```typescript
describe('processOutput', () => {
  it('returns trimmed text when within budget', async () => {
    const result = await processOutput(
      '  hello world  ',
      50,
      () => Promise.resolve('SHOULD_NOT_BE_CALLED'),
    );
    assertEquals(result, 'hello world');
  });

  it('throws on too-short output', async () => {
    let err: Error | null = null;
    try {
      await processOutput('hi', 50, () => Promise.resolve(''));
    } catch (e) {
      err = e as Error;
    }
    assertEquals(err !== null, true);
    assertEquals(err!.message.toLowerCase().includes('too short'), true);
  });

  it('throws on empty output', async () => {
    let err: Error | null = null;
    try {
      await processOutput('', 50, () => Promise.resolve(''));
    } catch (e) {
      err = e as Error;
    }
    assertEquals(err !== null, true);
  });

  it('retries once when too long, returns retry result if within budget', async () => {
    let retryCount = 0;
    const retryFn = () => {
      retryCount++;
      return Promise.resolve('短い要約です。');
    };
    const longText = 'これは長すぎる要約です。'.repeat(20);
    const result = await processOutput(longText, 30, retryFn);
    assertEquals(retryCount, 1);
    assertEquals(result, '短い要約です。');
  });

  it('falls back to truncateAtSentenceBoundary when retry still too long', async () => {
    const longText = 'これは長すぎる要約です。これは二番目の文です。'.repeat(5);
    const stillLong = 'これは最初の文です。これも長すぎます。'.repeat(5);
    const result = await processOutput(longText, 22, () => Promise.resolve(stillLong));
    assertEquals(getWeightedLength(result) <= 22, true);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `deno test --allow-net --allow-env --allow-read src/tests/services.test.ts`
Expected: FAIL — `processOutput` not exported.

- [ ] **Step 3: Implement `processOutput`**

Add to `src/services/summarizer.ts` (after `trimReadme`):

```typescript
import { getWeightedLength, truncateAtSentenceBoundary } from '../core/tweet-utils.ts';

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
```

If the file already imports `getWeightedLength` / `truncateAtSentenceBoundary` from earlier work, deduplicate the import.

- [ ] **Step 4: Run tests to verify pass**

Run: `deno test --allow-net --allow-env --allow-read src/tests/services.test.ts`
Expected: 5 new `processOutput` tests PASS, all prior tests still PASS.

- [ ] **Step 5: Lint + format**

Run: `deno task fmt && deno task lint && deno task check`
Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add src/services/summarizer.ts src/tests/services.test.ts
git commit -m "feat(summarizer): add processOutput validation/retry helper"
```

---

## Task 4: Add `computeBodyBudget` and `buildPostMessage` to processor

**Files:**

- Modify: `src/core/processor.ts`
- Modify: `src/tests/core.test.ts`

These are the pure helpers the refactored `processStar` will use in Task 5. Adding them first (with tests) keeps Task 5 focused on wiring.

- [ ] **Step 1: Write failing tests**

Add to `src/tests/core.test.ts` — extend the imports:

```typescript
import { buildPostMessage, computeBodyBudget } from '../core/processor.ts';
import { MAX_TWEET_WEIGHT } from '../core/tweet-utils.ts';
```

Add new top-level `describe` blocks:

```typescript
describe('computeBodyBudget', () => {
  it('returns a smaller budget for longer repo names', () => {
    const shortRepo = computeBodyBudget('a/b');
    const longRepo = computeBodyBudget('very-long-org-name/very-long-repo-name');
    assertEquals(shortRepo > longRepo, true);
  });

  it('returns a positive budget for normal repo names', () => {
    assertEquals(computeBodyBudget('test-org/test-repo') > 0, true);
  });

  it('subtracts the prefix and URL/newline weights from MAX_TWEET_WEIGHT', () => {
    // "I just starred a/b - " = 21 ASCII chars. URL t.co weight = 23. Newline = 1.
    // Expected: 280 - 21 - 1 - 23 = 235
    assertEquals(computeBodyBudget('a/b'), 235);
  });
});

describe('buildPostMessage', () => {
  it('formats with prefix and url separated by newline', () => {
    const msg = buildPostMessage('owner/repo', '本文です', 'https://github.com/owner/repo');
    assertEquals(msg, 'I just starred owner/repo - 本文です\nhttps://github.com/owner/repo');
  });

  it('produces a message whose total weighted length fits when body fits its budget', () => {
    const repo = 'test-org/awesome-project';
    const url = 'https://github.com/test-org/awesome-project';
    const budget = computeBodyBudget(repo);
    // Construct a body exactly at the budget using ASCII chars (weight 1 each)
    const body = 'a'.repeat(budget);
    const msg = buildPostMessage(repo, body, url);
    // Total = prefix + body + newline + (url shortens to t.co=23 in X's count, but raw string is longer).
    // We assert against the X-counted weighted length using getWeightedLength on the
    // non-URL parts plus T_CO_URL_WEIGHT.
    const prefix = `I just starred ${repo} - `;
    const weighted = getWeightedLength(prefix) + getWeightedLength(body) + 1 /* \n */ +
      23 /* t.co */;
    assertEquals(weighted <= MAX_TWEET_WEIGHT, true);
    assertEquals(msg.startsWith(prefix), true);
    assertEquals(msg.endsWith(url), true);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `deno test --allow-net --allow-env --allow-read src/tests/core.test.ts`
Expected: FAIL — `buildPostMessage` and `computeBodyBudget` not exported.

- [ ] **Step 3: Implement helpers**

Edit `src/core/processor.ts`. Add at the top, after the existing imports:

```typescript
import {
  getWeightedLength,
  MAX_TWEET_WEIGHT,
  NEWLINE_WEIGHT,
  T_CO_URL_WEIGHT,
} from './tweet-utils.ts';
```

Then add (above `processStar`):

```typescript
const POST_PREFIX = (repo: string) => `I just starred ${repo} - `;

/** Compute the weighted character budget for the AI-generated body. */
export function computeBodyBudget(repo: string): number {
  return (
    MAX_TWEET_WEIGHT -
    getWeightedLength(POST_PREFIX(repo)) -
    NEWLINE_WEIGHT -
    T_CO_URL_WEIGHT
  );
}

/** Build the final tweet text from repo, body, and url. */
export function buildPostMessage(repo: string, body: string, url: string): string {
  return `${POST_PREFIX(repo)}${body}\n${url}`;
}
```

If imports of `getWeightedLength`, `truncateToWeightedLength`, `MAX_SUMMARY_WEIGHT` were imported by the old code, leave them for now — Task 5 cleans them up.

- [ ] **Step 4: Run tests to verify pass**

Run: `deno test --allow-net --allow-env --allow-read src/tests/core.test.ts`
Expected: All new tests PASS, existing tests still PASS.

- [ ] **Step 5: Lint + format**

Run: `deno task fmt && deno task lint && deno task check`
Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add src/core/processor.ts src/tests/core.test.ts
git commit -m "feat(processor): add computeBodyBudget and buildPostMessage helpers"
```

---

## Task 5: Wire helpers into `summarizeRepository` and `processStar`

This task is atomic because the signature change of `summarizeRepository` requires `processor.ts` to update its call site in the same commit (otherwise `deno task check` fails).

**Files:**

- Modify: `src/services/summarizer.ts`
- Modify: `src/core/processor.ts`

- [ ] **Step 1: Replace `summarizeRepository` body**

Edit `src/services/summarizer.ts`. Replace the existing `summarizeRepository` function (and the unused legacy prompt construction) with:

```typescript
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
        { role: 'assistant', content: initialText },
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
```

Confirm imports at top of file include:

```typescript
import { mastra } from '../ai/agents.ts';
import type { GenerateOptions, Message, ModelType, StarData } from '../types/index.ts';
import { getWeightedLength, truncateAtSentenceBoundary } from '../core/tweet-utils.ts';
```

(`truncateAtSentenceBoundary` may already be imported from Task 3; deduplicate.)

Note: the final-fallback string changed from `"I just starred ${repo} - Unable to..."` to just `"Unable to generate summary"` because the prefix is now added by `processor.ts`. The user-visible result is identical.

- [ ] **Step 2: Update `processStar` to use new helpers**

Edit `src/core/processor.ts`. Replace the body of `processStar` with:

```typescript
export async function processStar(star: StarData): Promise<void> {
  console.log(`[Processor] Starting to process: ${star.repo}`);

  const bodyBudget = computeBodyBudget(star.repo);
  console.log(`[Processor] Generating AI summary for ${star.repo} (budget=${bodyBudget})...`);
  const body = await summarizeRepository(star, bodyBudget);
  console.log(`[Processor] Summary generated (${getWeightedLength(body)} weighted chars)`);

  const message = buildPostMessage(star.repo, body, star.url);
  console.log(`[Processor] Posting to X...`);
  await postToX(message);

  console.log(`[Processor] Successfully posted about ${star.repo}`);
}
```

Remove the now-unused imports from `processor.ts`:

- Remove `truncateToWeightedLength` from the `./tweet-utils.ts` import.
- Remove `MAX_SUMMARY_WEIGHT` from the `./tweet-utils.ts` import.

Final import block in `processor.ts` should look like:

```typescript
import { getRecentStars } from '../services/github.ts';
import { summarizeRepository } from '../services/summarizer.ts';
import { postToX } from '../services/twitter.ts';
import { filterUnprocessedStars, markStarAsProcessed } from '../services/processed-stars.ts';
import type { StarData } from '../types/index.ts';
import {
  getWeightedLength,
  MAX_TWEET_WEIGHT,
  NEWLINE_WEIGHT,
  T_CO_URL_WEIGHT,
} from './tweet-utils.ts';
```

- [ ] **Step 3: Run type check**

Run: `deno task check`
Expected: PASS — confirms the signature change is wired through everywhere.

- [ ] **Step 4: Run all tests**

Run: `deno task test`
Expected: All previously-passing tests still PASS. No new tests added in this task; the helpers are exercised indirectly.

- [ ] **Step 5: Lint + format**

Run: `deno task fmt && deno task lint`
Expected: Pass.

- [ ] **Step 6: Commit**

```bash
git add src/services/summarizer.ts src/core/processor.ts
git commit -m "refactor(summarizer): take bodyBudget, validate output, retry once"
```

---

## Task 6: Update model identifiers

**Files:**

- Modify: `src/ai/agents.ts`

- [ ] **Step 1: Verify current model availability (read-only)**

Briefly check each provider's current model catalog for the exact alias to use. The spec proposes:

| Agent             | New model             | Verification                                                                 |
| ----------------- | --------------------- | ---------------------------------------------------------------------------- |
| `openrouterAgent` | `openai/gpt-5.4-nano` | Check https://openrouter.ai/models for the exact slug                        |
| `deepseekAgent`   | `deepseek-v4-flash`   | Check https://api-docs.deepseek.com/quick_start/pricing                      |
| `mistralAgent`    | `ministral-8b`        | Check https://docs.mistral.ai/models/overview — may be `ministral-8b-latest` |

If a provider's preferred form is `*-latest` instead of the family name, use that.

- [ ] **Step 2: Update model strings**

Edit `src/ai/agents.ts`:

```typescript
export const openrouterAgent = new Agent({
  name: 'openrouterAgent',
  instructions: config.systemPrompt,
  model: openrouter('openai/gpt-5.4-nano'),
});

export const deepseekAgent = new Agent({
  name: 'deepseekAgent',
  instructions: config.systemPrompt,
  model: deepseek('deepseek-v4-flash'),
});

export const mistralAgent = new Agent({
  name: 'mistralAgent',
  instructions: config.systemPrompt,
  model: mistral('ministral-8b'),
});
```

(Substitute `*-latest` if Step 1 found a different alias.)

- [ ] **Step 3: Run type check + tests**

Run: `deno task check && deno task test && deno task fmt && deno task lint`
Expected: All pass. (Tests don't hit the network; only `deno task start` does.)

- [ ] **Step 4: Manual smoke test (requires `.env` with valid keys)**

Run: `deno task start`

Watch for at least one star to be processed. If no stars are pending, temporarily modify `TIME_WINDOW_MINUTES` in `src/services/github.ts` to a larger value like `1440` (24 hours), confirm a fetch and summary, then revert.

Confirm:

- AI generates a summary in Japanese.
- Summary is grounded in `description` (no fabricated names).
- Total tweet length ≤ 280 weighted (the X API will reject otherwise).
- All three providers reachable: temporarily break `OPENROUTER_API_KEY`, run again, verify DeepSeek path. Repeat for Mistral.

- [ ] **Step 5: Commit**

```bash
git add src/ai/agents.ts
git commit -m "feat(ai): refresh model IDs (gpt-5.4-nano, deepseek-v4-flash, ministral-8b)"
```

---

## Task 7: Remove unused `MAX_SUMMARY_WEIGHT`

**Files:**

- Modify: `src/core/tweet-utils.ts`

- [ ] **Step 1: Verify no remaining usages**

Run: `grep -rn 'MAX_SUMMARY_WEIGHT' src/`
Expected: only the export line in `src/core/tweet-utils.ts`. If any other file references it, stop and update those callers first (most likely a test file imported it for assertions).

- [ ] **Step 2: Remove the export**

Edit `src/core/tweet-utils.ts`. Delete this line:

```typescript
export const MAX_SUMMARY_WEIGHT = MAX_TWEET_WEIGHT - T_CO_URL_WEIGHT - NEWLINE_WEIGHT;
```

- [ ] **Step 3: Run check + tests + lint**

Run: `deno task check && deno task test && deno task fmt && deno task lint`
Expected: All pass.

- [ ] **Step 4: Commit**

```bash
git add src/core/tweet-utils.ts
git commit -m "chore(tweet-utils): drop unused MAX_SUMMARY_WEIGHT constant"
```

---

## Verification

**Automated (must pass before opening PR):**

```bash
deno task fmt
deno task lint
deno task check
deno task test
```

All four should report success.

**Manual smoke (must pass before merging):**

- [ ] Run `deno task start` against a real environment with at least 3 fresh stars.
- [ ] Include at least one repo with a long README (5KB+, many badges).
- [ ] Include at least one repo with empty `description`.
- [ ] Open the resulting tweets on X; confirm character counter ≤ 280.
- [ ] Visually confirm no fabricated technical names (no "Yeo7"-style corruption).
- [ ] Confirm prefix `"I just starred {repo} - "` is present.
- [ ] Confirm fallback chain by temporarily breaking `OPENROUTER_API_KEY` and verifying DeepSeek runs.

**Out-of-band reminder:** the `deepseek-chat` legacy alias retires 2026-07-24. Task 6 must ship before that date.
