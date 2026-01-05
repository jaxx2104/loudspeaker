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

# Type check all TypeScript files
deno task check

# Format code
deno task fmt

# Lint code
deno task lint

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

### Optional Environment Variables

- `PROCESSED_STARS_CACHE`: Cache file path for processed stars (default: `.processed-stars.json`)

## Project Structure

```
src/
├── ai/              # AI provider configurations and Mastra agents
├── config/          # Environment variable configuration and validation
├── core/            # Main processing logic orchestration
├── services/        # External API integrations (GitHub, X, AI summarizer)
├── tests/           # Deno standard tests
├── types/           # TypeScript type definitions
└── index.ts         # Application entry point

.github/workflows/
├── star-to-x.yml    # Main workflow (runs every 15 minutes)
└── keepalive.yml    # Prevents workflow suspension
```

See `README.md` for detailed architecture documentation.

## Testing

- **Always run tests before committing**: `deno task test`
- Tests are located in `src/tests/`
- Uses Deno standard testing library (`@std/assert`, `@std/testing/bdd`)
- See `src/tests/CLAUDE.md` for testing patterns

## Code Style

- Follow Deno formatter settings defined in `deno.json`
- Run `deno task fmt` to format code
- Run `deno task lint` to check for issues
- Use single quotes, 2-space indentation, semicolons

## Directory-Specific Guidance

Each major directory contains its own `CLAUDE.md` with detailed guidance:

- `src/ai/CLAUDE.md` - AI provider and agent configuration
- `src/services/CLAUDE.md` - Service layer implementation
- `src/config/CLAUDE.md` - Environment configuration patterns
- `src/tests/CLAUDE.md` - Testing patterns and conventions
