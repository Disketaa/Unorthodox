import { decelerate } from './Decelerate';

/** What one line of a count is counting between, and how long it is given to do it in. */
export interface CountSpec {
  from: number;
  to: number;
  durationMs: number;
}

/** What the count is doing at a point into its line: the figure counting up over the whole of
 * the line's own time, with nothing standing in its place before it. */
export function frameAt(elapsedMs: number, spec: CountSpec): number {
  const count = elapsedMs / spec.durationMs;
  return Math.round(spec.from + (spec.to - spec.from) * decelerate(count));
}
