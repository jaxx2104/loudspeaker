import { assertEquals } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import type { Config, StarData, ModelType } from '../types/index.ts';

describe('Type definitions', () => {
  it('should define Config interface correctly', () => {
    const mockConfig: Config = {
      github: {
        token: 'test_token',
        username: 'test_user',
      },
      twitter: {
        apiKey: 'test_key',
        apiSecret: 'test_secret',
        accessToken: 'test_token',
        accessSecret: 'test_access_secret',
      },
      openrouter: {
        apiKey: 'test_openrouter_key',
      },
      deepseek: {
        apiKey: 'test_deepseek_key',
      },
      mistral: {
        apiKey: 'test_mistral_key',
      },
      systemPrompt: 'Test prompt',
    };

    assertEquals(typeof mockConfig.github.token, 'string');
    assertEquals(typeof mockConfig.twitter.apiKey, 'string');
    assertEquals(typeof mockConfig.systemPrompt, 'string');
  });

  it('should define StarData interface correctly', () => {
    const mockStarData: StarData = {
      repo: 'test/repo',
      description: 'Test description',
      url: 'https://github.com/test/repo',
      primaryLanguage: 'JavaScript',
      readme: 'Test readme content',
      starredAt: new Date(),
    };

    assertEquals(typeof mockStarData.repo, 'string');
    assertEquals(typeof mockStarData.url, 'string');
    assertEquals(mockStarData.starredAt instanceof Date, true);
  });

  it('should define ModelType union correctly', () => {
    const validModels: ModelType[] = ['openrouter', 'deepseek', 'mistral'];
    
    for (const model of validModels) {
      assertEquals(typeof model, 'string');
      assertEquals(['openrouter', 'deepseek', 'mistral'].includes(model), true);
    }
  });

  it('should handle nullable fields in StarData', () => {
    const starDataWithNulls: StarData = {
      repo: 'test/repo',
      description: null,
      url: 'https://github.com/test/repo',
      primaryLanguage: 'Unknown',
      readme: '',
      starredAt: new Date(),
    };

    assertEquals(starDataWithNulls.description, null);
    assertEquals(typeof starDataWithNulls.repo, 'string');
  });
});