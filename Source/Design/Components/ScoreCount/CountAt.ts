import { scoreMarkHoldMs } from '../ScoreTiming';
import { decelerate } from './Decelerate';

/** Which of the three the room is looking at. A line with nothing to add has no middle and goes
 * straight from the figure to the count. */
export type CountPhase = 'from' | 'mark' | 'count';

/** Where the mark stands in the line: at a fifth of it, and up to just under three quarters of
 * it or the minimum hold, whichever gives more. The share is a ceiling rather than the whole
 * answer — a long line still does not spend most of itself holding one picture up. */
const MarkAt = 0.2;
const MarkCeiling = 0.72;

/** The window the mark is up for, in milliseconds into this line. A mark that wanted more than
 * its line was given used to take it by stretching the line, and every millisecond it stretched
 * by came out of the step after it: the card was still counting when the board had moved on. */
function markWindow(durationMs: number): { from: number; to: number } {
  const from = durationMs * MarkAt;
  return {
    from,
    to: Math.max(from, Math.min(durationMs * MarkCeiling, from + scoreMarkHoldMs())),
  };
}

/** What one line of a count is counting between, and how long it is given to do it in. */
export interface CountSpec {
  from: number;
  to: number;
  /** Whether this line has a mark to stand in the figure's place first. */
  marked: boolean;
  durationMs: number;
}

/** Where a frame of the count is: waiting on the figure, holding the mark, or counting up. */
export interface Frame {
  phase: CountPhase;
  value: number;
}

/** What the count is doing at a point into its line. Split off from the frame loop so the walk
 * is a function of the clock rather than a shape the loop happens to have: the figure waits
 * while the mark stands, then the count takes the line's remaining time at whatever is left. */
export function frameAt(elapsedMs: number, spec: CountSpec): Frame {
  const mark = markWindow(spec.durationMs);
  if (spec.marked && elapsedMs < mark.from) return { phase: 'from', value: spec.from };
  if (spec.marked && elapsedMs < mark.to) return { phase: 'mark', value: spec.from };
  const span = spec.durationMs - mark.to;
  const count = spec.marked
    ? span <= 0
      ? 1
      : (elapsedMs - mark.to) / span
    : elapsedMs / spec.durationMs;
  return {
    phase: 'count',
    value: Math.round(spec.from + (spec.to - spec.from) * decelerate(count)),
  };
}
