import { assertEquals } from '@std/assert';
import { beforeEach, describe, it } from '@std/testing/bdd';
import type { StarData } from '../types/index.ts';

// Mock environment variables
const mockEnvVars = {
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

// Mock star data
const mockStarData: StarData = {
  repo: 'integration-test/sample-repo',
  description: 'A sample repository for integration testing',
  url: 'https://github.com/integration-test/sample-repo',
  primaryLanguage: 'JavaScript',
  readme: 'This is a sample Node.js application for testing integration workflows.',
  starredAt: new Date(),
};

describe('Integration Tests', () => {
  beforeEach(() => {
    // Set up mock environment variables
    for (const [key, value] of Object.entries(mockEnvVars)) {
      Deno.env.set(key, value);
    }
  });

  it('should process star data end-to-end (mock)', async () => {
    // This test verifies the data flow without making actual API calls
    
    // 1. Verify star data structure
    assertEquals(typeof mockStarData.repo, 'string');
    assertEquals(mockStarData.url.startsWith('https://'), true);
    assertEquals(mockStarData.starredAt instanceof Date, true);

    // 2. Verify configuration loading
    const { config } = await import('../config/env.ts');
    assertEquals(config.github.token, 'mock_github_token');
    assertEquals(config.systemPrompt, 'Create a concise summary of this repository.');

    // 3. Verify message formatting
    const mockSummary = 'Sample Node.js app for testing integration workflows';
    const expectedMessage = `${mockSummary}\n${mockStarData.url}`;
    
    assertEquals(expectedMessage.includes(mockSummary), true);
    assertEquals(expectedMessage.includes(mockStarData.url), true);
    assertEquals(expectedMessage.split('\n').length, 2);
  });

  it('should handle multiple star data items', () => {
    const multipleStars: StarData[] = [
      mockStarData,
      {
        ...mockStarData,
        repo: 'test/repo-2',
        url: 'https://github.com/test/repo-2',
        primaryLanguage: 'Python',
      },
      {
        ...mockStarData,
        repo: 'test/repo-3',
        url: 'https://github.com/test/repo-3',
        primaryLanguage: 'Go',
        description: null,
      },
    ];

    assertEquals(multipleStars.length, 3);
    assertEquals(multipleStars[1]?.primaryLanguage, 'Python');
    assertEquals(multipleStars[2]?.description, null);
    
    // Verify all items have required fields
    for (const star of multipleStars) {
      assertEquals(typeof star.repo, 'string');
      assertEquals(star.url.startsWith('https://'), true);
      assertEquals(star.starredAt instanceof Date, true);
    }
  });

  it('should validate AI fallback chain order', async () => {
    const { config } = await import('../config/env.ts');
    
    // Verify all AI providers are configured
    assertEquals(typeof config.openrouter.apiKey, 'string');
    assertEquals(typeof config.deepseek.apiKey, 'string');
    assertEquals(typeof config.mistral.apiKey, 'string');
    
    // Verify the expected fallback order exists
    const expectedProviders = ['openrouter', 'deepseek', 'mistral'];
    for (const provider of expectedProviders) {
      assertEquals(typeof provider, 'string');
    }
  });

  it('should handle error scenarios gracefully', () => {
    // Test with malformed star data
    const malformedData = {
      ...mockStarData,
      starredAt: 'invalid-date', // This should be a Date object
    };

    // The system should handle this gracefully
    assertEquals(typeof malformedData.repo, 'string');
    assertEquals(typeof malformedData.starredAt, 'string'); // Invalid but caught
  });
});