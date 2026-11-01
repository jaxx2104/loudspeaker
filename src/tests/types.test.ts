import { describe, expect, it } from 'bun:test';
import type { Config, ModelType, StarData } from '../types/index.ts';

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

    expect(typeof mockConfig.github.token).toEqual('string');
    expect(typeof mockConfig.twitter.apiKey).toEqual('string');
    expect(typeof mockConfig.systemPrompt).toEqual('string');
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

    expect(typeof mockStarData.repo).toEqual('string');
    expect(typeof mockStarData.url).toEqual('string');
    expect(mockStarData.starredAt instanceof Date).toEqual(true);
  });

  it('should define ModelType union correctly', () => {
    const validModels: ModelType[] = ['openrouter', 'deepseek', 'mistral'];

    for (const model of validModels) {
      expect(typeof model).toEqual('string');
      expect(['openrouter', 'deepseek', 'mistral'].includes(model)).toEqual(true);
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

    expect(starDataWithNulls.description).toEqual(null);
    expect(typeof starDataWithNulls.repo).toEqual('string');
  });
});
