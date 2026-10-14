import { russianEndings } from './GroupingTables';
import { GameConfig } from './GameConfig';

/** Squeeze a run of one repeated letter down to a single letter, so an answer typed with a held
 * key reads as the word it is. Collapsing to one rather than two is what puts `нююх` and `нюх`
 * the same distance apart as `нюх` and `ннюх`, which the word match already allows. */
export function squeezeRuns(word: string): string {
  const floor = GameConfig.grouping.runSqueezeMin;
  return word.replace(/(.)\1+/g, (run) => (run.length >= floor ? run.charAt(0) : run));
}

/** Strip a typical Russian ending from a word, so a plural and a singular are one answer. The
 * first ending in the table that matches wins, which is why the two-letter ones are listed
 * first: a plural ending must not be shadowed by the single letter it starts with. */
export function stripRussianEndings(word: string): string {
  if (word.length < GameConfig.grouping.endingMinLength) {
    return word;
  }
  for (const ending of russianEndings) {
    if (word.endsWith(ending)) {
      return word.slice(0, -ending.length);
    }
  }
  return word;
}
