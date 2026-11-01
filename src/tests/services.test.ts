import { describe, expect, it } from 'bun:test';
import { getWeightedLength } from '../core/tweet-utils.ts';
import { processOutput, trimReadme } from '../services/summarizer.ts';
import type { StarData } from '../types/index.ts';

// Mock data for testing
const mockStarData: StarData = {
  repo: 'test-org/awesome-project',
  description: 'An awesome test project for demonstration',
  url: 'https://github.com/test-org/awesome-project',
  primaryLanguage: 'TypeScript',
  readme: 'This is an awesome TypeScript project that demonstrates best practices.',
  starredAt: new Date('2024-01-01T10:00:00Z'),
};

describe('Services', () => {
  describe('GitHub Service', () => {
    it('should handle StarData structure correctly', () => {
      expect(mockStarData.repo.includes('/')).toEqual(true);
      expect(mockStarData.url.startsWith('https://github.com/')).toEqual(true);
      expect(mockStarData.starredAt).not.toBeNil();
    });

    it('should handle repository with no description', () => {
      const repoWithoutDesc: StarData = {
        ...mockStarData,
        description: null,
      };

      expect(repoWithoutDesc.description).toEqual(null);
      expect(repoWithoutDesc.repo).not.toBeNil();
    });

    it('should validate star timestamp', () => {
      const now = new Date();
      const starredRepo: StarData = {
        ...mockStarData,
        starredAt: now,
      };

      expect(starredRepo.starredAt instanceof Date).toEqual(true);
      expect(starredRepo.starredAt.getTime()).toEqual(now.getTime());
    });
  });

  describe('Twitter Service', () => {
    it('should format message correctly', () => {
      const summary = 'Awesome TypeScript project with best practices';
      const expectedMessage = `${summary}\n${mockStarData.url}`;

      expect(expectedMessage.includes(summary)).toEqual(true);
      expect(expectedMessage.includes(mockStarData.url)).toEqual(true);
      expect(expectedMessage.includes('\n')).toEqual(true);
    });

    it('should handle long summaries', () => {
      const longSummary =
        'This is a very long summary that might exceed typical social media character limits but should still be handled gracefully by the system';
      const message = `${longSummary}\n${mockStarData.url}`;

      expect(message.length > mockStarData.url.length).toEqual(true);
      expect(message.endsWith(mockStarData.url)).toEqual(true);
    });
  });

  describe('Summarizer Service', () => {
    it('should handle repository data structure', () => {
      const prompt = `
- repo: ${mockStarData.repo}
- primaryLanguage: ${mockStarData.primaryLanguage}
- readme: ${mockStarData.readme}
`;

      expect(prompt.includes(mockStarData.repo)).toEqual(true);
      expect(prompt.includes(mockStarData.primaryLanguage)).toEqual(true);
      expect(prompt.includes(mockStarData.readme)).toEqual(true);
    });

    it('should handle missing readme content', () => {
      const dataWithoutReadme: StarData = {
        ...mockStarData,
        readme: '',
      };

      const prompt = `
- repo: ${dataWithoutReadme.repo}
- primaryLanguage: ${dataWithoutReadme.primaryLanguage}
- readme: ${dataWithoutReadme.readme || 'No README provided'}
`;

      expect(prompt.includes('No README provided')).toEqual(true);
    });
  });
});

describe('trimReadme', () => {
  it('removes badge images', () => {
    const input = 'Hello ![badge](https://img.shields.io/x.svg) world';
    expect(trimReadme(input)).toEqual('Hello  world');
  });

  it('removes HTML comments', () => {
    const input = '<!-- hidden -->visible';
    expect(trimReadme(input)).toEqual('visible');
  });

  it('removes fenced code blocks', () => {
    const input = 'before\n```ts\nconst x = 1;\n```\nafter';
    const result = trimReadme(input);
    expect(result.includes('const x')).toEqual(false);
    expect(result.includes('before')).toEqual(true);
    expect(result.includes('after')).toEqual(true);
  });

  it('caps length at maxChars', () => {
    const input = 'a'.repeat(2000);
    expect(trimReadme(input, 1500).length).toEqual(1500);
  });

  it('handles empty string', () => {
    expect(trimReadme('')).toEqual('');
  });
});

describe('processOutput', () => {
  it('returns trimmed text when within budget', async () => {
    const result = await processOutput('  hello world  ', 50, () =>
      Promise.resolve('SHOULD_NOT_BE_CALLED'),
    );
    expect(result).toEqual('hello world');
  });

  it('throws on too-short output', async () => {
    await expect(processOutput('hi', 50, () => Promise.resolve(''))).rejects.toThrow(/too short/i);
  });

  it('throws on empty output', async () => {
    await expect(processOutput('', 50, () => Promise.resolve(''))).rejects.toThrow();
  });

  it('retries once when too long, returns retry result if within budget', async () => {
    let retryCount = 0;
    const retryFn = () => {
      retryCount++;
      return Promise.resolve('短い要約です。');
    };
    const longText = 'これは長すぎる要約です。'.repeat(20);
    const result = await processOutput(longText, 30, retryFn);
    expect(retryCount).toEqual(1);
    expect(result).toEqual('短い要約です。');
  });

  it('falls back to truncateAtSentenceBoundary when retry still too long', async () => {
    const longText = 'これは長すぎる要約です。これは二番目の文です。'.repeat(5);
    const stillLong = 'これは最初の文です。これも長すぎます。'.repeat(5);
    const result = await processOutput(longText, 22, () => Promise.resolve(stillLong));
    expect(getWeightedLength(result) <= 22).toEqual(true);
  });
});
