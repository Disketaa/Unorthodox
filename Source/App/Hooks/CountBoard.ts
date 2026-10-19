import { GameConfig, countStepMs } from '@/Game';
import type { RevealState } from './UseReveal';

/** Where the count is on the board, read off the phase's own clock rather than off a state of
 * any one browser, so every screen in the room is on the same card at the same moment. Two
 * screens need it — the board and the bar of players — so it is worked out once here. */
export interface CountBoard {
  /** Which card the count is on. Past the last card it keeps walking rather than stopping, so
   * the board stays paid instead of falling back to showing its answers. */
  payingIndex?: number;
  /** How far into that card's count the room is, for the figures on it. */
  payingElapsedMs?: number;
  /** How long a card's count lasts, which is also how long one of its figures takes. */
  stepMs: number;
}

/** The board's own beat, shared with the host's clock rather than summed again here: the host
 * asks `scoresDurationMs` how long the count it is about to open will run, and a view with its
 * own copy of the sum is a view that can disagree with the phase it is drawing. */
export { countStepMs };

/** Which part of a card's cycle the room is in right now. The bar draws a different figure for
 * each one: nothing while the count runs, the addition once it lands, the total once the pause
 * is over. */
export type CountSubPhase = 'counting' | 'added' | 'total';

/** The sub-phase of the current card, worked out from how far into its cycle the room is. */
export function countSubPhase(payingElapsedMs: number): CountSubPhase {
  const countMs = GameConfig.timing.scoreCountMs;
  const addedHoldMs = GameConfig.timing.scoreAddedHoldMs;
  const gapMs = GameConfig.timing.scoreGapMs;
  if (payingElapsedMs < countMs) return 'counting';
  if (payingElapsedMs < countMs + addedHoldMs + gapMs) return 'added';
  return 'total';
}

export function countBoard(
  counting: boolean,
  phaseStartedAt: number,
  moment: number
): CountBoard {
  const stepMs = countStepMs();
  // A beat before the first card is its own, so the room is given a moment to look at the board
  // before anything on it is paid. Off the phase rather than off the mount, so the wait after a
  // reload is the same wait the first time round.
  const since = moment - phaseStartedAt - GameConfig.timing.scoreDramaDelayMs;
  const index = Math.floor(since / stepMs);
  return {
    payingIndex: counting && index >= 0 ? index : undefined,
    payingElapsedMs: index >= 0 ? since - index * stepMs : undefined,
    stepMs,
  };
}

/** The moment the board is counting from, which is its own clock unless the room is held: a held
 * room stands where it was held rather than counting the hold away, the same rule the board's
 * reveal is under since both are the room's one watch. */
export function countMoment(reveal: RevealState): number {
  return reveal.moment;
}
