import { useEffect, useState } from 'preact/hooks';
import {
  GameConfig,
  answerRevealBeat,
  writerDelayMs,
  answerWriteMs,
  authorsArrived,
  landedWriters,
  likesOffered,
  revealedCount,
  revealedLetterCount,
} from '@/Game';
import type { Pace } from '@/Game';

/** How much of the round's board is up, counted from the host's start of the phase so every
 * screen turns the same card at the same moment, and counted from it again the next round. A
 * held room freezes on the moment it was held rather than counting the hold away. */
export interface RevealState {
  /** How many answers have been turned over. */
  upTo: number;
  /** How much of the answer at this place is written out, in letters. */
  shownAt: (index: number, length: number) => number;
  /** Whether the room has been told who wrote the answer at this place yet. */
  authorsAt: (index: number) => boolean;
  /** When the nth writer of the answer at this place lands, in milliseconds from the moment the
   * writers start arriving. Handed to the card so the beat lives in one place: the round's, not
   * the drawing's. */
  writerDelayAt: (writer: number) => number;
  /** How many of the writers on the card at this place have landed, out of `total`. */
  landedAt: (index: number, total: number) => number;
  /** Whether the room is yet offered a like on the card at this place. */
  likesAt: (index: number, total: number) => boolean;
}

/** The board's count of answers turned over, and of the letters of the one being written.
 * `writerCounts` is the board as the round will play it, since the beat between cards is sized
 * from the largest thing on it. `startedAt` is this device's clock, already skew-corrected. */
export function useReveal(
  writerCounts: readonly number[],
  pace: Pace,
  durationMs: number,
  startedAt: number,
  active = true,
  held = false,
  heldAt?: number
): RevealState {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active || held) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), GameConfig.timing.uiTickMs);
    return () => clearInterval(id);
  }, [active, held]);

  const moment = held && heldAt !== undefined ? heldAt : now;
  const count = writerCounts.length;
  const voteMs = GameConfig.paces[pace].voteMs;
  const beat = answerRevealBeat(writerCounts, durationMs, voteMs);
  // Off the same moment the first card is counted from, including the lead-in, so the writing on a
  // card begins as that card comes over rather than a lead-in's worth of letters earlier.
  const first = startedAt + GameConfig.timing.revealLeadInMs;

  return {
    upTo: active ? revealedCount(writerCounts, durationMs, startedAt, moment, voteMs) : count,
    shownAt: (index, length) =>
      revealedLetterCount(length, moment - first - index * beat, answerWriteMs(length)),
    // Off the same moment the writing is, since a card that named its writers while the sentence
    // was still arriving would be answering a question the room had not finished being asked.
    authorsAt: (index) => authorsArrived(elapsedAt(moment, first, beat, index)),
    writerDelayAt: (writer) => writerDelayMs(writer),
    // Measured from the moment the writers start arriving rather than from the card's own beat, since
    // that delay is a wait which begins when the room is told rather than one already running.
    landedAt: (index, total) =>
      landedWriters(
        elapsedAt(moment, first, beat, index) - GameConfig.timing.revealAuthorsMs,
        total
      ),
    likesAt: (index, total) =>
      likesOffered(
        elapsedAt(moment, first, beat, index) - GameConfig.timing.revealAuthorsMs,
        total
      ),
  };
}

/** How far into this card's own beat the room is, in milliseconds. Negative before the card has
 * come up at all, which is how the first reader of the room knows it is early. */
function elapsedAt(moment: number, first: number, beat: number, index: number): number {
  return moment - first - index * beat;
}
