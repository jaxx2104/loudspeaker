# AI Layer

This directory contains AI provider configurations and Mastra agent definitions.

## Files

- `agents.ts` - Mastra agent instances for each AI provider
- `providers/` - Individual AI provider configurations
  - `openrouter.ts` - OpenRouter (primary provider)
  - `deepseek.ts` - DeepSeek (first fallback)
  - `mistral.ts` - Mistral (second fallback)
- `types.ts` - AI-specific type definitions

## Adding a New AI Provider

1. Create a new file in `providers/` (e.g., `providers/newprovider.ts`):

```typescript
import { createNewProvider } from '@ai-sdk/newprovider';

export const newprovider = createNewProvider({
  apiKey: Deno.env.get('NEWPROVIDER_API_KEY'),
});
```

2. Add the agent in `agents.ts`:

```typescript
import { newprovider } from './providers/newprovider.ts';

export const newproviderAgent = new Agent({
  name: 'newproviderAgent',
  instructions: config.systemPrompt,
  model: newprovider('model-name'),
});

// Add to mastra.agents
```

3. Update `src/services/summarizer.ts` to include the new agent in the fallback chain.

4. Add the new API key to environment variables in `src/config/env.ts`.

## Agent Configuration

- All agents use `config.systemPrompt` for consistent behavior
- Temperature is set to 0.3 for reliable, consistent summaries
- Telemetry is disabled in production

## Fallback Order

OpenRouter → DeepSeek → Mistral

If primary provider fails, the summarizer automatically tries the next provider in the chain.
