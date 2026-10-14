import { editDistance, editsAllowed } from './EditDistance';

/** A word with a digit in it, which has to match exactly: "дота 2" and "дота 3" are two
 * different answers and not one typo. */
const digit = /[0-9]/;

/** Whether two words are the same word: exactly, or within the edits the shorter of them is
 * allowed. */
export function sameWord(a: string, b: string): boolean {
  if (a === b) {
    return true;
  }
  if (digit.test(a) || digit.test(b)) {
    return false;
  }
  return editDistance(a, b) <= editsAllowed(Math.min(a.length, b.length));
}

/** Whether two lists of words are the same answer: the same count, in the same order, each word
 * matching the one opposite it. A different count is never a match, however similar the strings
 * look — "дота два" and "дота" are two answers and one. */
export function sameWords(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((word, index) => sameWord(word, b[index]));
}
