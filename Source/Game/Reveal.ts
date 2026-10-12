import { GameConfig } from './GameConfig';

/** How long after one answer comes the next, for a board of this many. The game's own beat, and
 * shortened when there are more answers than the phase has time for: a full room's board still
 * has to be up before the phase ends, and the run is what is given up, never the voting time. */
export function answerRevealBeat(count: number, durationMs: number): number {
  const spendable = Math.max(0, durationMs - GameConfig.timing.revealVoteMs);
  const perCard = spendable / Math.max(1, count - 1);
  return Math.max(1, Math.min(GameConfig.timing.revealCardMs, perCard));
}

/** How many of the round's answers are up at a moment counted from the host's start of the
 * phase. So every screen in the room turns the same card at the same moment, and the next round
 * deals the board face down again. */
export function revealedCount(
  count: number,
  durationMs: number,
  startedAt: number,
  now: number
): number {
  if (count <= 0) return 0;
  const beat = answerRevealBeat(count, durationMs);
  const since = now - startedAt - GameConfig.timing.revealLeadInMs;
  if (since <= 0) return 0;
  return Math.min(count, Math.floor(since / beat) + 1);
}

/** How long this answer takes to be written out: a rate per letter, held between a floor and a
 * ceiling. The floor stops a three-letter answer arriving in one frame; the ceiling stops a
 * sentence still arriving after the next card has opened. */

export function answerWriteMs(length: number): number {
  const timing = GameConfig.timing;
  const typed = length * timing.revealLetterMs;
  return Math.min(timing.revealWriteMaxMs, Math.max(timing.revealWriteMinMs, typed));
}

/** How much of one answer has been written out, over `writeMs` from the moment its own card came
 * up. Quick against the card's own beat: the rest of the beat is the room reading the answer,
 * and an answer still arriving when the next card opens is one nobody has read. */
export function revealedLetterCount(
  length: number,
  elapsedMs: number,
  writeMs: number
): number {
  if (length <= 0) return 0;
  if (elapsedMs <= 0) return 0;
  const written = Math.floor((elapsedMs / writeMs) * length);
  return Math.min(length, written);
}

/** The answer as far as it has been written, which is the whole of it by the time the card is
 * up. Cut mid-letter rather than at a word: the room is reading a card being typed at it, and a
 * half-drawn word is where a sentence being written is most legible. */
export function typedOut(text: string, shown: number): string {
  return text.slice(0, Math.min(text.length, Math.max(0, shown)));
}
