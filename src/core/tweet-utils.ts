// X API character counting constants
// URLs are always shortened to t.co links (23 weighted characters)
export const T_CO_URL_WEIGHT = 23;
export const MAX_TWEET_WEIGHT = 280;
export const NEWLINE_WEIGHT = 1;

/**
 * Check if a Unicode code point is a double-weight character in X's counting.
 * CJK characters, Japanese kana, and supplementary plane characters count as 2.
 */
function isDoubleWeightChar(code: number): boolean {
  return (
    code > 0xffff || // Supplementary planes (emoji, CJK extensions B-F)
    (code >= 0x1100 && code <= 0x115f) || // Hangul Jamo
    (code >= 0x2e80 && code <= 0x4dbf) || // CJK Radicals, Kangxi, CJK Ext A
    (code >= 0x3040 && code <= 0x33bf) || // Hiragana, Katakana, Bopomofo, CJK Marks
    (code >= 0x4e00 && code <= 0x9fff) || // CJK Unified Ideographs
    (code >= 0xa000 && code <= 0xa4cf) || // Yi
    (code >= 0xac00 && code <= 0xd7ff) || // Hangul Syllables
    (code >= 0xf900 && code <= 0xfaff) || // CJK Compatibility Ideographs
    (code >= 0xfe30 && code <= 0xfe6f) || // CJK Compatibility Forms
    (code >= 0xff00 && code <= 0xffef) // Fullwidth Forms
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

const SENTENCE_ENDERS = new Set(['\u3002', '\uff0e', '\uff01', '\uff1f', '!', '?', '\n']);

/** Truncate text at the last sentence-ender within the weighted budget. */
export function truncateAtSentenceBoundary(text: string, maxWeight: number): string {
  if (getWeightedLength(text) <= maxWeight) return text;

  let weight = 0;
  let byteIndex = 0;
  let bestCutAt = -1;

  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    const charWeight = isDoubleWeightChar(code) ? 2 : 1;
    if (weight + charWeight > maxWeight) break;
    weight += charWeight;
    byteIndex += char.length;
    if (SENTENCE_ENDERS.has(char)) {
      bestCutAt = byteIndex;
    }
  }

  if (bestCutAt > 0) return text.slice(0, bestCutAt);
  return truncateToWeightedLength(text, maxWeight);
}
