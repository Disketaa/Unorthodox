/** The round's question, arriving one word at a time and then standing there. Pure, and kept off
 * the state and out of the components: what a screen shows is a count read off the host's
 * clock, so two screens cannot write the same question out at two different speeds. */
import { GameConfig } from './GameConfig';

/** The question's words, in order. Split on whitespace so punctuation stays attached to the word
 * it belongs to, which is what a player reads the question as. */
export function questionWords(question: string): string[] {
  return question.split(/\s+/u).filter((word) => word.length > 0);
}

/** How long the whole question takes: the beat before the first word, a beat per word, and the
 * hold once the last one is in. From the words rather than a fixed length, so a two-word
 * question is not held longer than it is read. */
export function questionRevealMs(question: string): number {
  const { questionLeadInMs, questionWordMs, questionHoldMs } = GameConfig.timing;
  return questionLeadInMs + questionWords(question).length * questionWordMs + questionHoldMs;
}

/** How many words are on screen `elapsedMs` into the question. Every word is in before the
 * lead-in ends rather than the first arriving with it, so the question starts on a beat and is
 * never blank when the hold begins counting. */
export function revealedWordCount(question: string, elapsedMs: number): number {
  const { questionLeadInMs, questionWordMs } = GameConfig.timing;
  const count = questionWords(question).length;
  if (elapsedMs < questionLeadInMs) return 0;
  return Math.min(count, Math.floor((elapsedMs - questionLeadInMs) / questionWordMs) + 1);
}
