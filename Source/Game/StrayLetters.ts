import { oneLetterWords } from './GroupingTables';
import { GameConfig } from './GameConfig';

/** A single Cyrillic letter, which after normalization is the only shape a fragment can take. */
const singleLetter = /^[а-я]$/;

/** Glue the fragments of a word that was typed with the spaces still in it back into one word.
 * Two passes, because a spaced-out word takes two shapes: a run of three or more single letters is
 * a word somebody spelled out, and a lone single letter beside a longer token is a word
 * somebody's thumb split in half. */
export function mergeStrayLetters(tokens: readonly string[]): string[] {
  return glueFragments(collapseRuns(tokens));
}

/** A run of single letters long enough to be a spelled-out word becomes that word. Real one-letter
 * words are counted here, since "я в а" spelled out is one word and not three — the cost being
 * that a genuine "я в а" is read the same way, which is rare enough to accept. */
function collapseRuns(tokens: readonly string[]): string[] {
  const merged: string[] = [];
  let run: string[] = [];
  const flush = () => {
    if (run.length >= GameConfig.grouping.strayRunMin) {
      merged.push(run.join(''));
    } else {
      merged.push(...run);
    }
    run = [];
  };
  for (const token of tokens) {
    if (singleLetter.test(token)) {
      run.push(token);
      continue;
    }
    flush();
    merged.push(token);
  }
  flush();
  return merged;
}

/** A lone fragment glues to the word before it, or to the word after it where it starts the
 * answer. A one-letter word is left alone: "в лесу" is two words and "влесу" is a different
 * answer. */
function glueFragments(tokens: readonly string[]): string[] {
  const merged: string[] = [];
  for (const token of tokens) {
    const previous = merged[merged.length - 1];
    if (previous !== undefined && isFragment(token)) {
      merged[merged.length - 1] = previous + token;
      continue;
    }
    merged.push(token);
  }
  const first = merged[0];
  const second = merged[1];
  if (first !== undefined && second !== undefined && isFragment(first)) {
    return [first + second, ...merged.slice(2)];
  }
  return merged;
}

/** A fragment is a single letter that is not a word of its own. */
function isFragment(token: string): boolean {
  return singleLetter.test(token) && !oneLetterWords.has(token);
}
