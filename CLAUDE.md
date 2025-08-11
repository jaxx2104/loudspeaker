# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Run the application locally
deno task start

# Run with file watching (development mode)
deno task dev

# Run all Deno standard tests
deno task test

# Run specific test suites
deno task test-unit          # Type and core tests
deno task test-config        # Configuration tests
deno task test-services      # Service layer tests
deno task test-integration   # Integration tests

# Test the Mastra summarizer with all providers (legacy)
deno task test-summarizer

# Type check all TypeScript files
deno task check

# Format code
deno task fmt

# Lint code
deno task lint

# Manual workflow trigger (GitHub Actions)  
# Go to Actions tab → Star to X Share → Run workflow
# Note: GitHub Actions now uses Deno instead of Node.js
```

## Required Environment Variables

All development requires these environment variables in `.env` file:

- `USER_GITHUB_TOKEN`: GitHub Personal Access Token
- `USER_GITHUB_NAME`: GitHub username
- `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET`: X API credentials
- `OPENROUTER_API_KEY`, `DEEPSEEK_API_KEY`, `MISTRAL_API_KEY`: AI service API keys
- `SYSTEM_PROMPT`: Configurable system prompt for AI summarization

## Architecture Overview

This is a GitHub Action that automatically shares starred repositories on X (Twitter) every 15 minutes using AI-generated summaries.

**Modular Service Layer Pattern (TypeScript with Deno):**

**AI Layer:**
- `src/ai/agents.ts`: Mastra agent configurations for different AI providers
- `src/ai/providers/`: Individual AI provider configurations (OpenRouter, DeepSeek, Mistral)
- `src/ai/types.ts`: AI-specific type definitions

**Configuration Layer:**
- `src/config/env.ts`: Environment variable configuration with strong typing
- `src/config/validation.ts`: Environment variable validation logic

**Core Layer:**
- `src/core/processor.ts`: Main processing logic orchestration

**Service Layer:**
- `src/services/github.ts`: GitHub GraphQL API interactions for fetching recent stars
- `src/services/summarizer.ts`: AI-powered repository summarization using Mastra framework
- `src/services/twitter.ts`: X API v2 posting functionality

**Type Layer:**
- `src/types/config.ts`: Configuration type definitions
- `src/types/github.ts`: GitHub API type definitions
- `src/types/index.ts`: Centralized type exports

**Entry Point:**
- `src/index.ts`: Main application entry point

**Key Flow:**

1. `core/processor.ts` orchestrates the main processing flow
2. `services/github.ts` fetches stars from last 15 minutes using GraphQL
3. `services/summarizer.ts` creates AI-powered summaries with configurable system prompt
4. `services/twitter.ts` posts formatted messages to X
5. Process repeats every 15 minutes via GitHub Actions cron schedule

**AI Integration:**

- Primary model: OpenRouter GPT-5-nano (with DeepSeek → Mistral fallback chain)
- AI providers cleanly separated in `ai/providers/` directory
- Mastra agents managed centrally in `ai/agents.ts`
- Uses Mastra framework with AI SDK for unified LLM operations
- Temperature set to 0.3 for consistent summaries
- Agent-based architecture with configurable system prompt
- Automatic fallback order: OpenRouter → DeepSeek → Mistral

**Design Principles:**

- **Single Responsibility**: Each file/module handles one specific concern
- **Modular Architecture**: Clear separation between AI, config, services, and types
- **High Cohesion, Low Coupling**: Related functionality grouped together, minimal dependencies
- **Type Safety**: Comprehensive TypeScript coverage across all modules

**API Rate Limiting:**

- 15-minute intervals prevent GitHub/X API limits
- GraphQL pagination handles large star collections
- Built-in retry logic with model fallback
