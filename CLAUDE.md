# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies (Bun version is pinned via mise: `mise install`)
bun install

# Run the application locally (.env is loaded automatically by Bun)
bun run start

# Run with file watching (development mode)
bun run dev

# Run all tests (bun:test)
bun test

# Type check all TypeScript files
bun run check

# Format code (Biome)
bun run fmt

# Lint code (Biome)
bun run lint

# Run everything CI runs (Biome check, type check, tests)
bun run ci

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
├── tests/           # bun:test tests
├── types/           # TypeScript type definitions
└── index.ts         # Application entry point

.github/workflows/
├── ci.yml           # Biome, type check and tests on pull requests
├── star-to-x.yml    # Main workflow (runs every 15 minutes)
└── keepalive.yml    # Prevents workflow suspension
```

See `README.md` for detailed architecture documentation.

## Testing

- **Always run tests before committing**: `bun test`
- Tests are located in `src/tests/`
- Uses Bun's built-in test runner (`bun:test`)
- `src/tests/setup.ts` is preloaded via `bunfig.toml` and sets mock environment variables
- See `src/tests/CLAUDE.md` for testing patterns

## Code Style

- Follow the Biome settings defined in `biome.json`
- Run `bun run fmt` to format code
- Run `bun run lint` to check for issues
- Use single quotes, 2-space indentation, semicolons

## Directory-Specific Guidance

Each major directory contains its own `CLAUDE.md` with detailed guidance:

- `src/ai/CLAUDE.md` - AI provider and agent configuration
- `src/services/CLAUDE.md` - Service layer implementation
- `src/config/CLAUDE.md` - Environment configuration patterns
- `src/tests/CLAUDE.md` - Testing patterns and conventions
