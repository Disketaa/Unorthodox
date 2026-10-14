import { normalizeAnswer } from './Normalization';
import { transliterateLatin } from './Transliteration';
import { mergeStrayLetters } from './StrayLetters';
import { squeezeRuns, stripRussianEndings } from './WordForms';

/** The words an answer is made of, in the shape the grouping compares them. The order of the
 * stages is the whole of the rule: transliteration first, since everything after it assumes one
 * script; then the stray letters glued, before a word can be squeezed or an ending stripped. */
export function answerWords(answer: string): string[] {
  return mergeStrayLetters(transliterateLatin(normalizeAnswer(answer)).split(' '))
    .filter((token) => token.length > 0)
    .map((word) => stripRussianEndings(squeezeRuns(word)));
}
