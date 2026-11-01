import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Preloaded by `bun test` (see bunfig.toml).
// Modules under src/ai and src/config read and validate env vars at import time,
// so mock values must exist before any test file is loaded. Values are always
// overwritten so that a local .env (auto-loaded by Bun) never reaches the tests.
export const mockEnvVars = {
  USER_GITHUB_TOKEN: 'mock_github_token',
  USER_GITHUB_NAME: 'mock_user',
  X_API_KEY: 'mock_x_api_key',
  X_API_SECRET: 'mock_x_api_secret',
  X_ACCESS_TOKEN: 'mock_x_access_token',
  X_ACCESS_SECRET: 'mock_x_access_secret',
  OPENROUTER_API_KEY: 'mock_openrouter_key',
  DEEPSEEK_API_KEY: 'mock_deepseek_key',
  MISTRAL_API_KEY: 'mock_mistral_key',
  SYSTEM_PROMPT: 'Create a concise summary of this repository.',
};

for (const [key, value] of Object.entries(mockEnvVars)) {
  process.env[key] = value;
}

// Keep the processed-stars cache out of the repository's real .processed-stars.json.
process.env.PROCESSED_STARS_CACHE = join(tmpdir(), `loudspeaker-test-${process.pid}.json`);
