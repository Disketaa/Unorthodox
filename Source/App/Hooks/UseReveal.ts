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

/** How much of the round's board is up, counted from the host's start of the phase so every
 * screen turns the same card at the same moment, and counted from it again the next round. A
 * held room freezes on the moment it was held rather than counting the hold away. */
export interface RevealState {
  /** The moment this drawing is counting from: the wall clock now, or the moment a held room was
   * held. Shared rather than private, so anything else on the same board can be counted from
   * the same moment instead of each keeping a tick of its own that stops somewhere else. */
  moment: number;
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

/** This device's clock while the board is counting, which stops when the room is held. */
function useClock(active: boolean, held: boolean): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active || held) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), GameConfig.timing.uiTickMs);
    return () => clearInterval(id);
  }, [active, held]);

  return now;
}

/** The board's count of answers turned over, and of the letters of the one being written:
 * `writerCounts` as the round will play it, `startedAt` this device's skew-corrected clock.
 * `settled` is the round already read over, so it is counted at rest rather than again. */
export function useReveal(
  writerCounts: readonly number[],
  startedAt: number,
  active = true,
  held = false,
  heldAt?: number,
  settled = false
): RevealState {
  const now = useClock(active, held);

  const moment = held && heldAt !== undefined ? heldAt : now;
  const count = writerCounts.length;
  const beat = answerRevealBeat(writerCounts);
  // Off the same moment the first card is counted from, including the lead-in, so the writing on a
  // card begins as that card comes over rather than a lead-in's worth of letters earlier.
  const first = startedAt + GameConfig.timing.revealLeadInMs;

  if (settled) {
    return atRest(count, moment);
  }

  return {
    moment,
    upTo: active ? revealedCount(writerCounts, startedAt, moment) : count,
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

/** A board every question has already answered: every card up, every answer whole, every writer
 * in its corner and every like offered. What the room is looking at when it comes back to the
 * board it has already read once. */
function atRest(count: number, moment: number): RevealState {
  return {
    moment,
    upTo: count,
    shownAt: (_index, length) => length,
    authorsAt: () => true,
    writerDelayAt: () => 0,
    landedAt: (_index, total) => total,
    likesAt: () => true,
  };
}

/** How far into this card's own beat the room is, in milliseconds. Negative before the card has
 * come up at all, which is how the first reader of the room knows it is early. */
function elapsedAt(moment: number, first: number, beat: number, index: number): number {
  return moment - first - index * beat;
}
