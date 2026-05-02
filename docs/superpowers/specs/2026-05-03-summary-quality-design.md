# Summary Quality Design

- **Date:** 2026-05-03
- **Status:** Approved (pending user spec review)
- **Scope:** Improve the quality of AI-generated repository summaries posted to X, and refresh model identifiers.

## Problem

Two quality issues are observed in posted summaries:

**1. Shallow / hallucinated content**

- The official GitHub `description` field is fetched in `src/services/github.ts` but never passed to the AI in `src/services/summarizer.ts:8-12`. The most authoritative source of truth is discarded.
- The full README is dumped into the user prompt with no curation, distracting smaller models from the canonical purpose.
- Example hallucinations observed in production posts: "Tribev2", "Yeo7" — the latter is most likely a corruption of "YOLOv7". Small models read technical names from the README and rewrite them inaccurately.
- The fallback chain ends in `mistral-tiny`, the weakest of the three providers, which amplifies this.

**2. Sloppy truncation**

- The user prompt contains no length budget, so model output length is unpredictable.
- When output exceeds the X character budget, `truncateToWeightedLength` slices mid-character with a trailing ellipsis, leaving fragments mid-thought.

## Goals

- Ground summaries in the official `description` plus a curated README excerpt; eliminate fabricated technical names.
- Communicate an exact character budget to the model so truncation becomes rare; when it still happens, prefer sentence boundaries over mid-word ellipsis.
- Refresh model identifiers to current-generation lightweight models. The `deepseek-chat` migration is mandatory because the legacy ID is deprecated on 2026-07-24.
- Keep `SYSTEM_PROMPT` as a user-managed environment variable. Do not move it into code.
- Keep the existing 3-provider fallback chain (OpenRouter → DeepSeek → Mistral) for resilience.
- Keep the visible `"I just starred {repo} - "` prefix on posts, but move it to a code-side template (the AI generates only the body).

## Non-Goals

- LLM-as-a-judge automatic evaluation.
- Automatic hallucination detection (e.g., flagging tokens not in source).
- A/B testing infrastructure.
- Schema-validated structured output (`generateObject`). Deferred — not all fallback models guarantee reliable JSON output.
- Multi-language output. Japanese fixed.
- Adding a 4th provider.

## Architecture

```
GitHub stars
  ↓
[github.ts]  description / README / language fetched (unchanged)
  ↓
[summarizer.ts]  (refactored)
  ① trimReadme: strip badges, code blocks, HTML comments; cap at ~1500 chars
  ② Build user message with description, language, README excerpt, bodyBudget,
     and fact-grounding constraints
  ③ agent.generate
  ④ Validate output (length / non-empty)
  ⑤ If too long: regenerate once with shorter-budget hint (same model)
  ⑥ If still too long: truncateAtSentenceBoundary (final defensive truncation)
     If empty / too short: throw → existing fallback chain advances
  ↓
[processor.ts]  (refactored)
  Build message via fixed template:
    "I just starred {repo} - {body}\n{url}"
  bodyBudget is computed from MAX_TWEET_WEIGHT minus the prefix/suffix weights
  and passed into summarizeRepository.
  ↓
X
```

The AI's responsibility narrows to producing the `body` only. The English `"I just starred {repo} - "` prefix and `"\n{url}"` suffix are fixed by code, eliminating one source of variability.

## Components

### `src/services/summarizer.ts` (refactored)

#### New helper: `trimReadme`

````typescript
function trimReadme(readme: string, maxChars = 1500): string {
  return readme
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // badge images
    .replace(/<!--[\s\S]*?-->/g, '') // HTML comments
    .replace(/```[\s\S]*?```/g, '') // fenced code blocks
    .replace(/\n{3,}/g, '\n\n') // collapse blank lines
    .trim()
    .slice(0, maxChars);
}
````

Exported from `summarizer.ts` so it can be unit-tested in isolation.

#### New user-message template (constant)

```
以下のリポジトリを日本語で要約してください。

- repo: {repo}
- 公式説明: {description ?? "(なし)"}
- 主要言語: {primaryLanguage}
- README 抜粋:
---
{readme_excerpt}
---

制約:
- 日本語で {bodyBudget} weighted 文字以内（X 換算で）
- 上記の「公式説明」「README 抜粋」に書かれている事実のみ使用
- 技術名・製品名・略語は元の表記を一文字も変えない（例: "YOLOv7" を "Yeo7" にしない）
- 出力に含めないもの: リポ名、URL、"I just starred"、ハッシュタグ、絵文字
- 1〜2 文で、何ができる/何が新しいか を述べる
```

The fact-grounding rule is intentionally explicit (with the "Yeo7" example) to combat the observed corruption pattern.

#### Updated signature

```typescript
export async function summarizeRepository(
  repositoryData: StarData,
  bodyBudget: number,
  modelType: ModelType = 'openrouter',
): Promise<string>;
```

The recursive fallback path passes `bodyBudget` through unchanged.

#### Validation loop

```typescript
const result = await agent.generate(messages, options);
const text = (result.text ?? '').trim();

if (text.length < 10) {
  throw new Error('Summary too short or empty'); // → existing fallback chain
}

if (getWeightedLength(text) > bodyBudget) {
  const retried = await retryShorter(agent, messages, text, bodyBudget);
  if (getWeightedLength(retried) <= bodyBudget) return retried;
  return truncateAtSentenceBoundary(retried, bodyBudget);
}
return text;
```

`retryShorter` appends one follow-up user message:

> 先ほどの出力は {N} weighted 文字でした。{bodyBudget} weighted 文字以内に短縮した日本語要約のみを返してください。

The retry is bounded to a single attempt to control latency and cost. Errors from the retry call propagate to the existing `try/catch` and trigger the next provider in the fallback chain.

### `src/core/tweet-utils.ts` (additions)

#### New: `truncateAtSentenceBoundary(text: string, maxWeight: number): string`

Walks the string accumulating weighted length, recording the last seen sentence-ender (`。．！？!?\n`). On overflow, slices at the recorded position. If no sentence-ender was reached within budget, falls back to the existing `truncateToWeightedLength`.

Existing `truncateToWeightedLength`, weight constants (`MAX_TWEET_WEIGHT`, `T_CO_URL_WEIGHT`, `NEWLINE_WEIGHT`), and `getWeightedLength` are kept. `MAX_SUMMARY_WEIGHT` becomes unused once `processor.ts` computes the budget dynamically and should be removed.

### `src/core/processor.ts` (refactored)

```typescript
const prefix = `I just starred ${star.repo} - `;
const bodyBudget = MAX_TWEET_WEIGHT -
  getWeightedLength(prefix) -
  NEWLINE_WEIGHT -
  T_CO_URL_WEIGHT;

const body = await summarizeRepository(star, bodyBudget);
const message = `${prefix}${body}\n${star.url}`;
await postToX(message);
```

The previous `truncateToWeightedLength` call is removed from this layer; truncation responsibility moves into `summarizer.ts`.

### `src/ai/agents.ts` (model identifier updates)

| Agent             | Old model           | New model             |
| ----------------- | ------------------- | --------------------- |
| `openrouterAgent` | `openai/gpt-5-nano` | `openai/gpt-5.4-nano` |
| `deepseekAgent`   | `deepseek-chat`     | `deepseek-v4-flash`   |
| `mistralAgent`    | `mistral-tiny`      | `ministral-8b`        |

Provider SDK packages remain unchanged (no `deno.json` import updates required for model swaps). Only model identifier strings change. At implementation time, verify the exact alias each provider expects (e.g., Mistral may require `ministral-8b-latest` rather than the bare family name).

## Error Handling

- **Empty / too-short output** (< 10 chars after trim): throw → existing fallback chain advances to the next provider.
- **Too-long output**: regenerate once with a shorter-budget hint, then sentence-boundary truncate.
- **All providers fail**: existing behavior preserved — return `"I just starred {repo} - Unable to generate summary"`. The phrasing intentionally stays in English to match the prefix template.

## Testing

### Unit tests

| File                                     | Subject                              | Cases                                                                                                                                                           |
| ---------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/tests/tweet-utils.test.ts` (new)    | `truncateAtSentenceBoundary`         | cuts at `。`; falls back to ellipsis when no sentence-ender; honors weighted length; handles full-width chars                                                   |
| `src/tests/services.test.ts` (additions) | `trimReadme`                         | strips badges / code blocks / HTML comments; caps length; handles empty input                                                                                   |
| `src/tests/services.test.ts` (additions) | `summarizeRepository`                | passes `description` in messages; embeds `bodyBudget` in prompt string; retries once on too-long output; sentence-truncates after retry; throws on empty output |
| `src/tests/core.test.ts` (additions)     | message composition in `processStar` | template format matches; total weighted length ≤ 280; `bodyBudget` adjusts to repo-name length                                                                  |

Mocks: Mastra agent `.generate` is mocked directly (existing pattern). No real network calls.

### Manual verification (pre-PR)

- [ ] Run `deno task start` locally; review at least 3 generated outputs.
- [ ] Include one repo with a long README (5KB+, many badges).
- [ ] Include one repo with empty `description`.
- [ ] Confirm X character counter shows ≤ 280 weighted chars.
- [ ] Visually confirm no fabricated proper nouns (no "Yeo7"-style corruption).
- [ ] Verify fallback chain by temporarily breaking the OpenRouter API key.

## Migration Notes

- **`deepseek-chat` deprecation:** 2026-07-24. This change must ship before that date.
- **`SYSTEM_PROMPT`** stays a required env var. Recommended content (documented in README, not enforced):
  > あなたは GitHub リポジトリを簡潔に紹介する技術ライターです。
  > 日本語で、ユーザーから提供された情報のみを根拠に要約します。
  > 推測・補完・装飾はしません。
- Defense in depth is intentional: even if `SYSTEM_PROMPT` is empty or contradictory, the user-message constraints carry the load.
