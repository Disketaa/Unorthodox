/**
 * Normalize an answer string for comparison: lowercased, 'ё' folded to 'е',
 * punctuation replaced by a space, and runs of spaces collapsed.
 *
 * The 'ё' fold is deliberate: Russian players type it and plenty of keyboards do not carry
 * it, so the same word typed two ways has to compare equal. Punctuation becomes a space
 * rather than vanishing, so "а,б" splits into two words instead of fusing into "аб".
 */
export function normalizeAnswer(input: string): string {
  let result = input.toLowerCase();
  result = result.replace(/ё/g, 'е');
  result = result.replace(/[^a-zа-я0-9]/g, ' ');
  result = result.replace(/\s+/g, ' ');
  return result.trim();
}