# Services Layer

This directory contains external API integrations and business logic services.

## Files

- `github.ts` - GitHub GraphQL API interactions for fetching starred repositories
- `twitter.ts` - X (Twitter) API v2 posting functionality
- `summarizer.ts` - AI-powered repository summarization using Mastra framework
- `processed-stars.ts` - Cache management for tracking processed stars

## Service Responsibilities

### github.ts

- Fetches recently starred repositories using GitHub GraphQL API
- Filters stars from the last 15 minutes
- Handles pagination for large star collections
- Returns `StarData[]` with repo info, description, README, and language

### twitter.ts

- Posts formatted messages to X using API v2
- Handles OAuth 1.0a authentication
- Message format: `{summary}\n{url}`

### summarizer.ts

- Generates AI-powered summaries of repositories
- Uses Mastra agents with automatic fallback chain
- Fallback order: OpenRouter → DeepSeek → Mistral
- Temperature: 0.3 for consistent output

### processed-stars.ts

- Prevents duplicate processing of the same star
- Uses file-based cache (`.processed-stars.json`)
- Auto-cleanup of entries older than 24 hours
- Cache path configurable via `PROCESSED_STARS_CACHE` env var

## Adding a New Service

1. Create a new file following the naming pattern: `{service-name}.ts`
2. Export functions with clear, descriptive names
3. Add appropriate error handling and logging with `[ServiceName]` prefix
4. Update `src/core/processor.ts` if the service is part of the main flow
5. Add tests in `src/tests/services.test.ts`

## Logging Convention

Use bracketed prefix for log messages:
```typescript
console.log('[GitHub] Fetching recent stars...');
console.error('[Twitter] Failed to post:', error);
```
