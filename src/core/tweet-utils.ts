// X API character counting constants
// URLs are always shortened to t.co links (23 weighted characters)
export const T_CO_URL_WEIGHT = 23;
export const MAX_TWEET_WEIGHT = 280;
export const NEWLINE_WEIGHT = 1;
export const MAX_SUMMARY_WEIGHT = MAX_TWEET_WEIGHT - T_CO_URL_WEIGHT - NEWLINE_WEIGHT;

/**
 * Check if a Unicode code point is a double-weight character in X's counting.
 * CJK characters, Japanese kana, and supplementary plane characters count as 2.
 */
function isDoubleWeightChar(code: number): boolean {
  return (
    code > 0xFFFF || // Supplementary planes (emoji, CJK extensions B-F)
    (code >= 0x1100 && code <= 0x115F) || // Hangul Jamo
    (code >= 0x2E80 && code <= 0x4DBF) || // CJK Radicals, Kangxi, CJK Ext A
    (code >= 0x3040 && code <= 0x33BF) || // Hiragana, Katakana, Bopomofo, CJK Marks
    (code >= 0x4E00 && code <= 0x9FFF) || // CJK Unified Ideographs
    (code >= 0xA000 && code <= 0xA4CF) || // Yi
    (code >= 0xAC00 && code <= 0xD7FF) || // Hangul Syllables
    (code >= 0xF900 && code <= 0xFAFF) || // CJK Compatibility Ideographs
    (code >= 0xFE30 && code <= 0xFE6F) || // CJK Compatibility Forms
    (code >= 0xFF00 && code <= 0xFFEF) // Fullwidth Forms
  );
}

/** Calculate weighted character length for X's character counting. */
export function getWeightedLength(text: string): number {
  let length = 0;
  for (const char of text) {
    const code = char.codePointAt(0) || 0;
    length += isDoubleWeightChar(code) ? 2 : 1;
  }
  return length;
}

/** Truncate text to fit within a maximum weighted character count. */
export function truncateToWeightedLength(text: string, maxWeight: number): string {
  if (getWeightedLength(text) <= maxWeight) return text;

  const ellipsis = '\u2026';
  const ellipsisWeight = 1;
  const targetWeight = maxWeight - ellipsisWeight;

  let weight = 0;
  let i = 0;

  for (const char of text) {
    const code = char.codePointAt(0) || 0;
    const charWeight = isDoubleWeightChar(code) ? 2 : 1;

    if (weight + charWeight > targetWeight) {
      return text.slice(0, i) + ellipsis;
    }

    weight += charWeight;
    i += char.length; // Handle surrogate pairs correctly
  }

  return text;
}
