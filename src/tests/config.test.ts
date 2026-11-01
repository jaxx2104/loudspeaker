import { beforeEach, describe, expect, it } from 'bun:test';
import { mockEnvVars } from './setup.ts';

describe('Config validation', () => {
  beforeEach(() => {
    // Clear all environment variables
    for (const key of Object.keys(process.env)) {
      if (
        key.startsWith('USER_') ||
        key.startsWith('X_') ||
        key.includes('_API_KEY') ||
        key === 'SYSTEM_PROMPT'
      ) {
        delete process.env[key];
      }
    }
  });

  it('should validate environment variables successfully with all required vars set', async () => {
    // Set all required environment variables
    for (const [key, value] of Object.entries(mockEnvVars)) {
      process.env[key] = value;
    }

    const { validateEnvironment } = await import('../config/validation.ts');

    // Should not throw any error
    validateEnvironment();
  });

  it('should create config object with all required properties', async () => {
    // Set all required environment variables
    for (const [key, value] of Object.entries(mockEnvVars)) {
      process.env[key] = value;
    }

    const { config } = await import('../config/env.ts');

    expect(config.github.token).toEqual(mockEnvVars.USER_GITHUB_TOKEN);
    expect(config.github.username).toEqual(mockEnvVars.USER_GITHUB_NAME);
    expect(config.twitter.apiKey).toEqual(mockEnvVars.X_API_KEY);
    expect(config.openrouter.apiKey).toEqual(mockEnvVars.OPENROUTER_API_KEY);
    expect(config.deepseek.apiKey).toEqual(mockEnvVars.DEEPSEEK_API_KEY);
    expect(config.mistral.apiKey).toEqual(mockEnvVars.MISTRAL_API_KEY);
    expect(config.systemPrompt).toEqual(mockEnvVars.SYSTEM_PROMPT);
  });
});
