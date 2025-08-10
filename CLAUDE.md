# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm ci

# Run the application locally
npm start

# Test the Mastra summarizer with all providers
npm test

# Manual workflow trigger (GitHub Actions)
# Go to Actions tab → Star to X Share → Run workflow
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

**Service Layer Pattern:**
- `src/config/env.js`: Centralized environment variable validation and configuration
- `src/services/github.js`: GitHub GraphQL API interactions for fetching recent stars
- `src/services/summarizer.js`: AI-powered repository summarization using LangChain with Mistral/DeepSeek models
- `src/services/twitter.js`: X API v2 posting functionality
- `src/index.js`: Main orchestration logic

**Key Flow:**
1. GitHub service fetches stars from last 15 minutes using GraphQL
2. For each star, summarizer creates 50-character summary using configurable system prompt
3. Twitter service posts formatted message with summary and URL
4. Process repeats every 15 minutes via GitHub Actions cron schedule

**AI Integration:**
- Primary model: OpenRouter GPT-5-nano (with DeepSeek -> Mistral fallback chain)
- Uses Mastra framework with AI SDK for unified LLM operations
- Temperature set to 0.3 for consistent summaries
- Agent-based architecture with configurable system prompt
- Automatic fallback order: OpenRouter -> DeepSeek -> Mistral

**API Rate Limiting:**
- 15-minute intervals prevent GitHub/X API limits
- GraphQL pagination handles large star collections
- Built-in retry logic with model fallback