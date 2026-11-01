import { describe, expect, it } from 'bun:test';
import { buildPostMessage, computeBodyBudget } from '../core/processor.ts';
import {
  getWeightedLength,
  MAX_TWEET_WEIGHT,
  truncateToWeightedLength,
} from '../core/tweet-utils.ts';
import type { StarData } from '../types/index.ts';

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
    expect(mockStarData.repo).toEqual('test-org/test-repo');
    expect(mockStarData.primaryLanguage).toEqual('TypeScript');
    expect(typeof mockStarData.starredAt).toEqual('object');
    expect(mockStarData.starredAt instanceof Date).toEqual(true);
  });

  it('should handle star data with null description', () => {
    const starWithNullDesc: StarData = {
      ...mockStarData,
      description: null,
    };

    expect(starWithNullDesc.description).toEqual(null);
    expect(typeof starWithNullDesc.repo).toEqual('string');
  });

  it('should handle star data with empty readme', () => {
    const starWithEmptyReadme: StarData = {
      ...mockStarData,
      readme: '',
    };

    expect(starWithEmptyReadme.readme).toEqual('');
    expect(starWithEmptyReadme.url.startsWith('https://')).toEqual(true);
  });
});

describe('getWeightedLength', () => {
  it('should count ASCII characters as weight 1', () => {
    expect(getWeightedLength('hello')).toEqual(5);
    expect(getWeightedLength('abc 123')).toEqual(7);
  });

  it('should count CJK characters as weight 2', () => {
    expect(getWeightedLength('\u3053\u3093\u306B\u3061\u306F')).toEqual(10); // こんにちは = 5 chars, 10 weight
  });

  it('should count mixed content correctly', () => {
    expect(getWeightedLength('Hello \u4E16\u754C')).toEqual(10); // "Hello " = 6, "世界" = 4
  });

  it('should handle empty string', () => {
    expect(getWeightedLength('')).toEqual(0);
  });

  it('should count fullwidth characters as weight 2', () => {
    expect(getWeightedLength('\uFF21\uFF22\uFF23')).toEqual(6); // ＡＢＣ = 3 chars, 6 weight
  });

  it('should count katakana as weight 2', () => {
    expect(getWeightedLength('\u30C6\u30B9\u30C8')).toEqual(6); // テスト = 3 chars, 6 weight
  });
});

describe('truncateToWeightedLength', () => {
  it('should not truncate text within limit', () => {
    expect(truncateToWeightedLength('hello', 10)).toEqual('hello');
  });

  it('should truncate ASCII text exceeding limit', () => {
    const result = truncateToWeightedLength('hello world', 8);
    expect(result.endsWith('\u2026')).toEqual(true); // ends with …
    expect(getWeightedLength(result) <= 8).toEqual(true);
  });

  it('should truncate CJK text exceeding limit', () => {
    const text = '\u3053\u3093\u306B\u3061\u306F\u4E16\u754C'; // こんにちは世界 = 14 weight
    const result = truncateToWeightedLength(text, 10);
    expect(result.endsWith('\u2026')).toEqual(true);
    expect(getWeightedLength(result) <= 10).toEqual(true);
  });

  it('should return original text if exactly at limit', () => {
    expect(truncateToWeightedLength('hello', 5)).toEqual('hello');
  });

  it('should handle single character text', () => {
    expect(truncateToWeightedLength('a', 1)).toEqual('a');
  });
});

describe('computeBodyBudget', () => {
  it('returns a smaller budget for longer repo names', () => {
    const shortRepo = computeBodyBudget('a/b');
    const longRepo = computeBodyBudget('very-long-org-name/very-long-repo-name');
    expect(shortRepo > longRepo).toEqual(true);
  });

  it('returns a positive budget for normal repo names', () => {
    expect(computeBodyBudget('test-org/test-repo') > 0).toEqual(true);
  });

  it('subtracts the prefix and URL/newline weights from MAX_TWEET_WEIGHT', () => {
    // "I just starred a/b - " = 21 ASCII chars. URL t.co weight = 23. Newline = 1.
    // Expected: 280 - 21 - 1 - 23 = 235
    expect(computeBodyBudget('a/b')).toEqual(235);
  });
});

describe('buildPostMessage', () => {
  it('formats with prefix and url separated by newline', () => {
    const msg = buildPostMessage('owner/repo', '本文です', 'https://github.com/owner/repo');
    expect(msg).toEqual('I just starred owner/repo - 本文です\nhttps://github.com/owner/repo');
  });

  it('produces a message whose total weighted length fits when body fits its budget', () => {
    const repo = 'test-org/awesome-project';
    const url = 'https://github.com/test-org/awesome-project';
    const budget = computeBodyBudget(repo);
    const body = 'a'.repeat(budget);
    const msg = buildPostMessage(repo, body, url);
    const prefix = `I just starred ${repo} - `;
    const weighted =
      getWeightedLength(prefix) + getWeightedLength(body) + 1 /* \n */ + 23 /* t.co */;
    expect(weighted <= MAX_TWEET_WEIGHT).toEqual(true);
    expect(msg.startsWith(prefix)).toEqual(true);
    expect(msg.endsWith(url)).toEqual(true);
  });
});
