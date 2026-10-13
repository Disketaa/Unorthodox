import { useEffect, useState } from 'preact/hooks';
import {
  GameConfig,
  answerRevealBeat,
  answerWriteMs,
  authorsArrived,
  revealedCount,
  revealedLetterCount,
} from '@/Game';

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
}

/** The board's count of answers turned over, and of the letters of the one being written.
 * `startedAt` is already this device's own clock: the session converts the host's stamp through
 * the measured skew before a screen sees it, and adding that skew again counts from the future. */
export function useReveal(
  count: number,
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
  const beat = answerRevealBeat(count, durationMs);
  // Off the same moment the first card is counted from, including the lead-in, so the writing on a
  // card begins as that card comes over rather than a lead-in's worth of letters earlier.
  const first = startedAt + GameConfig.timing.revealLeadInMs;

  return {
    upTo: active ? revealedCount(count, durationMs, startedAt, moment) : count,
    shownAt: (index, length) =>
      revealedLetterCount(length, moment - first - index * beat, answerWriteMs(length)),
    // Off the same moment the writing is, since a card that named its writers while the sentence
    // was still arriving would be answering a question the room had not finished being asked.
    authorsAt: (index) => authorsArrived(moment - first - index * beat),
  };
}
