# Loudspeaker

A GitHub Action that automatically shares starred repositories on X (Twitter) every 15 minutes using AI-generated summaries.

## Features

- Automatic execution every 15 minutes via GitHub Actions cron schedule
- Fetches recently starred repositories using GitHub GraphQL API
- AI-powered repository summarization with configurable system prompt
- Multi-model AI support with fallback chain (OpenRouter → DeepSeek → Mistral)
- Automatic posting to X with formatted messages
- Built-in rate limiting and retry logic

## Setup

1. Fork this repository or copy the workflow file to your repository.

2. Set up the following GitHub Secrets:

   - `USER_GITHUB_TOKEN`: GitHub Personal Access Token
   - `USER_GITHUB_NAME`: Your GitHub username
   - `X_API_KEY`: X API Consumer Key
   - `X_API_SECRET`: X API Consumer Secret
   - `X_ACCESS_TOKEN`: X API Access Token
   - `X_ACCESS_SECRET`: X API Access Token Secret
   - `OPENROUTER_API_KEY`: OpenRouter API Key (primary)
   - `DEEPSEEK_API_KEY`: DeepSeek AI API Key (fallback)
   - `MISTRAL_API_KEY`: Mistral AI API Key (fallback)
   - `SYSTEM_PROMPT`: Configurable system prompt for AI summarization

   You can set these secrets in your GitHub repository under Settings > Secrets and variables > Actions.

3. Enable GitHub Actions.

## Development Commands

```bash
# Run the application locally
deno task start

# Run with file watching (development mode)
deno task dev

# Test the Mastra summarizer with all providers
deno task test

# Type check all TypeScript files
deno task check

# Format code
deno task fmt

# Lint code
deno task lint
```

## Project Structure

```
src/
├── config/
│   └── env.ts           # Environment variables configuration with strong typing
├── services/
│   ├── github.ts        # GitHub GraphQL API interactions
│   ├── summarizer.ts    # AI-powered summarization using Mastra framework
│   └── twitter.ts       # X API v2 posting functionality
├── types.ts             # TypeScript type definitions
└── index.ts             # Main orchestration logic
```

## Getting X API Credentials

1. Visit the [X Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create an App
3. Enable the following permissions:
   - Read and Write permissions
   - OAuth 1.0a
4. Generate the necessary keys and tokens

## Getting AI API Keys

### OpenRouter (Primary)
1. Visit [OpenRouter Platform](https://openrouter.ai/)
2. Sign up or log in
3. Generate an API key from your dashboard

### DeepSeek (Fallback)
1. Visit [DeepSeek Platform](https://platform.deepseek.com/)
2. Sign up or log in
3. Generate an API key from your dashboard

### Mistral AI (Fallback)
1. Visit [Mistral AI Platform](https://console.mistral.ai/)
2. Sign up or log in
3. Generate an API key from your dashboard

## Architecture

This project uses a **Service Layer Pattern** with TypeScript and Deno:

**Key Flow:**
1. GitHub service fetches stars from last 15 minutes using GraphQL
2. For each star, summarizer creates 50-character summary using configurable system prompt
3. Twitter service posts formatted message with summary and URL
4. Process repeats every 15 minutes via GitHub Actions cron schedule

**AI Integration:**
- Primary model: OpenRouter GPT-5-nano
- Fallback chain: OpenRouter → DeepSeek → Mistral
- Uses Mastra framework with AI SDK for unified LLM operations
- Temperature set to 0.3 for consistent summaries
- Agent-based architecture with configurable system prompt

## Customization

- To change the post message format, edit the message template in `src/index.ts`
- To modify the summary format, update the `SYSTEM_PROMPT` environment variable
- To adjust environment variables, modify `src/config/env.ts`

## License

MIT

## Notes

- Be mindful of X API rate limits
- Be aware of GitHub API rate limits  
- Consider AI API usage and costs across all providers
- 15-minute intervals prevent API rate limiting
- Built-in retry logic with model fallback ensures reliability
