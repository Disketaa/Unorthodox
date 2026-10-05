/** Mojibake signatures, in one place. The ESLint rule and the CSS audit both import from here,
 * the same way the comment shape is shared: two lists would drift, and a linter that disagrees
 * with its own audit about what counts as damage is worse than neither. */

/** U+FFFD is what a decoder leaves when the bytes are not valid UTF-8 at all, so it is only ever
 * damage. The other three lead characters belong to text that was UTF-8 read as CP1251 or
 * Latin-1: the Cyrillic pair is a misread em dash, and the two Latin ones are a misread smart
 * quote and the first half of any accented letter. */
export const SIGNATURES = [/\uFFFD/, /\u0432\u0402/, /\u00E2\u20AC/, /\u00C3/];

/** Deliberately absent: `\u0420` and `\u0421` lead the Cyrillic half of the same mojibake, and
 * this repo is written in Russian, so those two bytes are indistinguishable from ordinary
 * words. A rule that caught them would bury the four above in false positives on every line of
 * Strings.ts. */
export function findMojibake(text) {
  for (const signature of SIGNATURES) {
    const match = signature.exec(text);
    if (match !== null) return match;
  }
  return null;
}
