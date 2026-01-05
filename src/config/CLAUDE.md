# Configuration Layer

This directory handles environment variable configuration and validation.

## Files

- `env.ts` - Environment variable configuration with strong typing
- `validation.ts` - Environment variable validation logic

## Adding a New Environment Variable

1. Add the variable to `env.ts`:

```typescript
export const config = {
  // ... existing config
  newVariable: Deno.env.get('NEW_VARIABLE') ?? 'default_value',
} as const;
```

2. If required, add validation in `validation.ts`:

```typescript
export function validateEnv(): void {
  const required = [
    // ... existing required vars
    'NEW_VARIABLE',
  ];
  // validation logic
}
```

3. Update the root `CLAUDE.md` to document the new variable.

4. Add to GitHub Secrets if used in Actions workflow.

## Configuration Pattern

- Use `Deno.env.get()` for environment access
- Provide sensible defaults with `??` operator
- Use `as const` for type inference
- Validate at startup, fail fast on missing required vars

## Environment Variable Categories

### Required (no defaults)
- `USER_GITHUB_TOKEN` - GitHub API access
- `USER_GITHUB_NAME` - GitHub username
- `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET` - X API
- `OPENROUTER_API_KEY`, `DEEPSEEK_API_KEY`, `MISTRAL_API_KEY` - AI providers
- `SYSTEM_PROMPT` - AI summarization prompt

### Optional (with defaults)
- `PROCESSED_STARS_CACHE` - Cache file path (default: `.processed-stars.json`)
