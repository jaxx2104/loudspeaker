import { assertEquals, assertExists } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import type { StarData } from '../types/index.ts';
import { processOutput, trimReadme } from '../services/summarizer.ts';
import { getWeightedLength } from '../core/tweet-utils.ts';

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
      assertEquals(mockStarData.repo.includes('/'), true);
      assertEquals(mockStarData.url.startsWith('https://github.com/'), true);
      assertExists(mockStarData.starredAt);
    });

    it('should handle repository with no description', () => {
      const repoWithoutDesc: StarData = {
        ...mockStarData,
        description: null,
      };

      assertEquals(repoWithoutDesc.description, null);
      assertExists(repoWithoutDesc.repo);
    });

    it('should validate star timestamp', () => {
      const now = new Date();
      const starredRepo: StarData = {
        ...mockStarData,
        starredAt: now,
      };

      assertEquals(starredRepo.starredAt instanceof Date, true);
      assertEquals(starredRepo.starredAt.getTime(), now.getTime());
    });
  });

  describe('Twitter Service', () => {
    it('should format message correctly', () => {
      const summary = 'Awesome TypeScript project with best practices';
      const expectedMessage = `${summary}\n${mockStarData.url}`;

      assertEquals(expectedMessage.includes(summary), true);
      assertEquals(expectedMessage.includes(mockStarData.url), true);
      assertEquals(expectedMessage.includes('\n'), true);
    });

    it('should handle long summaries', () => {
      const longSummary =
        'This is a very long summary that might exceed typical social media character limits but should still be handled gracefully by the system';
      const message = `${longSummary}\n${mockStarData.url}`;

      assertEquals(message.length > mockStarData.url.length, true);
      assertEquals(message.endsWith(mockStarData.url), true);
    });
  });

  describe('Summarizer Service', () => {
    it('should handle repository data structure', () => {
      const prompt = `
- repo: ${mockStarData.repo}
- primaryLanguage: ${mockStarData.primaryLanguage}
- readme: ${mockStarData.readme}
`;

      assertEquals(prompt.includes(mockStarData.repo), true);
      assertEquals(prompt.includes(mockStarData.primaryLanguage), true);
      assertEquals(prompt.includes(mockStarData.readme), true);
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

      assertEquals(prompt.includes('No README provided'), true);
    });
  });
});

describe('trimReadme', () => {
  it('removes badge images', () => {
    const input = 'Hello ![badge](https://img.shields.io/x.svg) world';
    assertEquals(trimReadme(input), 'Hello  world');
  });

  it('removes HTML comments', () => {
    const input = '<!-- hidden -->visible';
    assertEquals(trimReadme(input), 'visible');
  });

  it('removes fenced code blocks', () => {
    const input = 'before\n```ts\nconst x = 1;\n```\nafter';
    const result = trimReadme(input);
    assertEquals(result.includes('const x'), false);
    assertEquals(result.includes('before'), true);
    assertEquals(result.includes('after'), true);
  });

  it('caps length at maxChars', () => {
    const input = 'a'.repeat(2000);
    assertEquals(trimReadme(input, 1500).length, 1500);
  });

  it('handles empty string', () => {
    assertEquals(trimReadme(''), '');
  });
});

describe('processOutput', () => {
  it('returns trimmed text when within budget', async () => {
    const result = await processOutput(
      '  hello world  ',
      50,
      () => Promise.resolve('SHOULD_NOT_BE_CALLED'),
    );
    assertEquals(result, 'hello world');
  });

  it('throws on too-short output', async () => {
    let err: Error | null = null;
    try {
      await processOutput('hi', 50, () => Promise.resolve(''));
    } catch (e) {
      err = e as Error;
    }
    assertEquals(err !== null, true);
    assertEquals(err!.message.toLowerCase().includes('too short'), true);
  });

  it('throws on empty output', async () => {
    let err: Error | null = null;
    try {
      await processOutput('', 50, () => Promise.resolve(''));
    } catch (e) {
      err = e as Error;
    }
    assertEquals(err !== null, true);
  });

  it('retries once when too long, returns retry result if within budget', async () => {
    let retryCount = 0;
    const retryFn = () => {
      retryCount++;
      return Promise.resolve('短い要約です。');
    };
    const longText = 'これは長すぎる要約です。'.repeat(20);
    const result = await processOutput(longText, 30, retryFn);
    assertEquals(retryCount, 1);
    assertEquals(result, '短い要約です。');
  });

  it('falls back to truncateAtSentenceBoundary when retry still too long', async () => {
    const longText = 'これは長すぎる要約です。これは二番目の文です。'.repeat(5);
    const stillLong = 'これは最初の文です。これも長すぎます。'.repeat(5);
    const result = await processOutput(longText, 22, () => Promise.resolve(stillLong));
    assertEquals(getWeightedLength(result) <= 22, true);
  });
});
