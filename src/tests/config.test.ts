import { assertEquals } from '@std/assert';
import { beforeEach, describe, it } from '@std/testing/bdd';

// Set up mock environment variables before importing the module
const mockEnvVars = {
  USER_GITHUB_TOKEN: 'test_github_token',
  USER_GITHUB_NAME: 'test_user',
  X_API_KEY: 'test_x_key',
  X_API_SECRET: 'test_x_secret',
  X_ACCESS_TOKEN: 'test_x_token',
  X_ACCESS_SECRET: 'test_x_access_secret',
  OPENROUTER_API_KEY: 'test_openrouter_key',
  DEEPSEEK_API_KEY: 'test_deepseek_key',
  MISTRAL_API_KEY: 'test_mistral_key',
  SYSTEM_PROMPT: 'Test system prompt',
};

describe('Config validation', () => {
  beforeEach(() => {
    // Clear all environment variables
    for (const key of Object.keys(Deno.env.toObject())) {
      if (key.startsWith('USER_') || key.startsWith('X_') || key.includes('_API_KEY') || key === 'SYSTEM_PROMPT') {
        Deno.env.delete(key);
      }
    }
  });

  it('should validate environment variables successfully with all required vars set', async () => {
    // Set all required environment variables
    for (const [key, value] of Object.entries(mockEnvVars)) {
      Deno.env.set(key, value);
    }

    const { validateEnvironment } = await import('../config/validation.ts');
    
    // Should not throw any error
    validateEnvironment();
  });

  it('should create config object with all required properties', async () => {
    // Set all required environment variables
    for (const [key, value] of Object.entries(mockEnvVars)) {
      Deno.env.set(key, value);
    }

    const { config } = await import('../config/env.ts');
    
    assertEquals(config.github.token, 'test_github_token');
    assertEquals(config.github.username, 'test_user');
    assertEquals(config.twitter.apiKey, 'test_x_key');
    assertEquals(config.openrouter.apiKey, 'test_openrouter_key');
    assertEquals(config.deepseek.apiKey, 'test_deepseek_key');
    assertEquals(config.mistral.apiKey, 'test_mistral_key');
    assertEquals(config.systemPrompt, 'Test system prompt');
  });
});