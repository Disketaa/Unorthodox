/**
 * Normalize an answer string for comparison.
 * Steps:
 * 1. Convert to lowercase.
 * 2. Replace 'ё' with 'е'.
 * 3. Remove punctuation (keep letters, digits, and spaces).
 * 4. Collapse multiple spaces into one.
 * 5. Trim leading and trailing spaces.
 */
export function normalizeAnswer(input: string): string {
  // Step 1: lowercase
  let result = input.toLowerCase();
  // Step 2: replace ё with е
  result = result.replace(/ё/g, 'е');
  // Step 3: remove punctuation (keep letters, digits, spaces)
  // We'll keep Cyrillic and Latin letters, digits.
  // Replace anything that is not a letter or digit with a space.
  result = result.replace(/[^a-zа-я0-9]/g, ' ');
  // Step 4: collapse multiple spaces
  result = result.replace(/\s+/g, ' ');
  // Step 5: trim
  return result.trim();
}