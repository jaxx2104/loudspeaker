import { describe, expect, it } from 'bun:test';
import { getWeightedLength, truncateAtSentenceBoundary } from '../core/tweet-utils.ts';

describe('truncateAtSentenceBoundary', () => {
  it('returns text unchanged when within budget', () => {
    expect(truncateAtSentenceBoundary('hello', 10)).toEqual('hello');
  });

  it('cuts at the last "。" within budget', () => {
    // 「これは最初の文です。」 = 10 chars × 2 = 20 weighted
    const text = 'これは最初の文です。これは二番目の文です。';
    const result = truncateAtSentenceBoundary(text, 22);
    expect(result).toEqual('これは最初の文です。');
  });

  it('cuts at "！" when present', () => {
    const text = 'すごい！次の文。';
    const result = truncateAtSentenceBoundary(text, 8);
    expect(result).toEqual('すごい！');
  });

  it('falls back to ellipsis when no sentence-ender within budget', () => {
    const text = 'abcdefghijklmnop';
    const result = truncateAtSentenceBoundary(text, 8);
    expect(result.endsWith('…')).toEqual(true);
    expect(getWeightedLength(result) <= 8).toEqual(true);
  });

  it('handles full-width characters correctly', () => {
    // ＡＢＣ。 = 4 chars × 2 = 8 weighted
    const text = 'ＡＢＣ。ＤＥＦ。';
    const result = truncateAtSentenceBoundary(text, 9);
    expect(result).toEqual('ＡＢＣ。');
  });
});
