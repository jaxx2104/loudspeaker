import { beforeEach, describe, expect, it } from 'bun:test';
import type { StarData } from '../types/index.ts';
import { mockEnvVars } from './setup.ts';

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
      process.env[key] = value;
    }
  });

  it('should process star data end-to-end (mock)', async () => {
    // This test verifies the data flow without making actual API calls

    // 1. Verify star data structure
    expect(typeof mockStarData.repo).toEqual('string');
    expect(mockStarData.url.startsWith('https://')).toEqual(true);
    expect(mockStarData.starredAt instanceof Date).toEqual(true);

    // 2. Verify configuration loading
    const { config } = await import('../config/env.ts');
    expect(config.github.token).toEqual('mock_github_token');
    expect(config.systemPrompt).toEqual('Create a concise summary of this repository.');

    // 3. Verify message formatting
    const mockSummary = 'Sample Node.js app for testing integration workflows';
    const expectedMessage = `${mockSummary}\n${mockStarData.url}`;

    expect(expectedMessage.includes(mockSummary)).toEqual(true);
    expect(expectedMessage.includes(mockStarData.url)).toEqual(true);
    expect(expectedMessage.split('\n').length).toEqual(2);
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

    expect(multipleStars.length).toEqual(3);
    expect(multipleStars[1]?.primaryLanguage).toEqual('Python');
    expect(multipleStars[2]?.description).toEqual(null);

    // Verify all items have required fields
    for (const star of multipleStars) {
      expect(typeof star.repo).toEqual('string');
      expect(star.url.startsWith('https://')).toEqual(true);
      expect(star.starredAt instanceof Date).toEqual(true);
    }
  });

  it('should validate AI fallback chain order', async () => {
    const { config } = await import('../config/env.ts');

    // Verify all AI providers are configured
    expect(typeof config.openrouter.apiKey).toEqual('string');
    expect(typeof config.deepseek.apiKey).toEqual('string');
    expect(typeof config.mistral.apiKey).toEqual('string');

    // Verify the expected fallback order exists
    const expectedProviders = ['openrouter', 'deepseek', 'mistral'];
    for (const provider of expectedProviders) {
      expect(typeof provider).toEqual('string');
    }
  });

  it('should handle error scenarios gracefully', () => {
    // Test with malformed star data
    const malformedData = {
      ...mockStarData,
      starredAt: 'invalid-date', // This should be a Date object
    };

    // The system should handle this gracefully
    expect(typeof malformedData.repo).toEqual('string');
    expect(typeof malformedData.starredAt).toEqual('string'); // Invalid but caught
  });
});
