import { assertEquals } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import { getWeightedLength, truncateAtSentenceBoundary } from '../core/tweet-utils.ts';

describe('truncateAtSentenceBoundary', () => {
  it('returns text unchanged when within budget', () => {
    assertEquals(truncateAtSentenceBoundary('hello', 10), 'hello');
  });

  it('cuts at the last "。" within budget', () => {
    // 「これは最初の文です。」 = 10 chars × 2 = 20 weighted
    const text = 'これは最初の文です。これは二番目の文です。';
    const result = truncateAtSentenceBoundary(text, 22);
    assertEquals(result, 'これは最初の文です。');
  });

  it('cuts at "！" when present', () => {
    const text = 'すごい！次の文。';
    const result = truncateAtSentenceBoundary(text, 8);
    assertEquals(result, 'すごい！');
  });

  it('falls back to ellipsis when no sentence-ender within budget', () => {
    const text = 'abcdefghijklmnop';
    const result = truncateAtSentenceBoundary(text, 8);
    assertEquals(result.endsWith('…'), true);
    assertEquals(getWeightedLength(result) <= 8, true);
  });

  it('handles full-width characters correctly', () => {
    // ＡＢＣ。 = 4 chars × 2 = 8 weighted
    const text = 'ＡＢＣ。ＤＥＦ。';
    const result = truncateAtSentenceBoundary(text, 9);
    assertEquals(result, 'ＡＢＣ。');
  });
});
