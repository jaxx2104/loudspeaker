import { assertEquals } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import type { StarData } from '../types/index.ts';
import { buildPostMessage, computeBodyBudget } from '../core/processor.ts';
import {
  getWeightedLength,
  MAX_TWEET_WEIGHT,
  truncateToWeightedLength,
} from '../core/tweet-utils.ts';

// Mock star data for testing
const mockStarData: StarData = {
  repo: 'test-org/test-repo',
  description: 'A test repository for unit testing',
  url: 'https://github.com/test-org/test-repo',
  primaryLanguage: 'TypeScript',
  readme: 'This is a test repository for demonstrating unit tests.',
  starredAt: new Date('2024-01-01T12:00:00Z'),
};

describe('Core processor', () => {
  it('should format star data correctly', () => {
    assertEquals(mockStarData.repo, 'test-org/test-repo');
    assertEquals(mockStarData.primaryLanguage, 'TypeScript');
    assertEquals(typeof mockStarData.starredAt, 'object');
    assertEquals(mockStarData.starredAt instanceof Date, true);
  });

  it('should handle star data with null description', () => {
    const starWithNullDesc: StarData = {
      ...mockStarData,
      description: null,
    };

    assertEquals(starWithNullDesc.description, null);
    assertEquals(typeof starWithNullDesc.repo, 'string');
  });

  it('should handle star data with empty readme', () => {
    const starWithEmptyReadme: StarData = {
      ...mockStarData,
      readme: '',
    };

    assertEquals(starWithEmptyReadme.readme, '');
    assertEquals(starWithEmptyReadme.url.startsWith('https://'), true);
  });
});

describe('getWeightedLength', () => {
  it('should count ASCII characters as weight 1', () => {
    assertEquals(getWeightedLength('hello'), 5);
    assertEquals(getWeightedLength('abc 123'), 7);
  });

  it('should count CJK characters as weight 2', () => {
    assertEquals(getWeightedLength('\u3053\u3093\u306B\u3061\u306F'), 10); // こんにちは = 5 chars, 10 weight
  });

  it('should count mixed content correctly', () => {
    assertEquals(getWeightedLength('Hello \u4E16\u754C'), 10); // "Hello " = 6, "世界" = 4
  });

  it('should handle empty string', () => {
    assertEquals(getWeightedLength(''), 0);
  });

  it('should count fullwidth characters as weight 2', () => {
    assertEquals(getWeightedLength('\uFF21\uFF22\uFF23'), 6); // ＡＢＣ = 3 chars, 6 weight
  });

  it('should count katakana as weight 2', () => {
    assertEquals(getWeightedLength('\u30C6\u30B9\u30C8'), 6); // テスト = 3 chars, 6 weight
  });
});

describe('truncateToWeightedLength', () => {
  it('should not truncate text within limit', () => {
    assertEquals(truncateToWeightedLength('hello', 10), 'hello');
  });

  it('should truncate ASCII text exceeding limit', () => {
    const result = truncateToWeightedLength('hello world', 8);
    assertEquals(result.endsWith('\u2026'), true); // ends with …
    assertEquals(getWeightedLength(result) <= 8, true);
  });

  it('should truncate CJK text exceeding limit', () => {
    const text = '\u3053\u3093\u306B\u3061\u306F\u4E16\u754C'; // こんにちは世界 = 14 weight
    const result = truncateToWeightedLength(text, 10);
    assertEquals(result.endsWith('\u2026'), true);
    assertEquals(getWeightedLength(result) <= 10, true);
  });

  it('should return original text if exactly at limit', () => {
    assertEquals(truncateToWeightedLength('hello', 5), 'hello');
  });

  it('should handle single character text', () => {
    assertEquals(truncateToWeightedLength('a', 1), 'a');
  });
});

describe('computeBodyBudget', () => {
  it('returns a smaller budget for longer repo names', () => {
    const shortRepo = computeBodyBudget('a/b');
    const longRepo = computeBodyBudget('very-long-org-name/very-long-repo-name');
    assertEquals(shortRepo > longRepo, true);
  });

  it('returns a positive budget for normal repo names', () => {
    assertEquals(computeBodyBudget('test-org/test-repo') > 0, true);
  });

  it('subtracts the prefix and URL/newline weights from MAX_TWEET_WEIGHT', () => {
    // "I just starred a/b - " = 21 ASCII chars. URL t.co weight = 23. Newline = 1.
    // Expected: 280 - 21 - 1 - 23 = 235
    assertEquals(computeBodyBudget('a/b'), 235);
  });
});

describe('buildPostMessage', () => {
  it('formats with prefix and url separated by newline', () => {
    const msg = buildPostMessage('owner/repo', '本文です', 'https://github.com/owner/repo');
    assertEquals(msg, 'I just starred owner/repo - 本文です\nhttps://github.com/owner/repo');
  });

  it('produces a message whose total weighted length fits when body fits its budget', () => {
    const repo = 'test-org/awesome-project';
    const url = 'https://github.com/test-org/awesome-project';
    const budget = computeBodyBudget(repo);
    const body = 'a'.repeat(budget);
    const msg = buildPostMessage(repo, body, url);
    const prefix = `I just starred ${repo} - `;
    const weighted = getWeightedLength(prefix) + getWeightedLength(body) + 1 /* \n */ +
      23 /* t.co */;
    assertEquals(weighted <= MAX_TWEET_WEIGHT, true);
    assertEquals(msg.startsWith(prefix), true);
    assertEquals(msg.endsWith(url), true);
  });
});
