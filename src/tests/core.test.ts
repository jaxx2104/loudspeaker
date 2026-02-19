import { assertEquals } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import type { StarData } from '../types/index.ts';
import { getWeightedLength, truncateToWeightedLength } from '../core/tweet-utils.ts';

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