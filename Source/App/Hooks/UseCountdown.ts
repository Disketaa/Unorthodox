import { useUiTick } from './UseUiTick';

/** Remaining time of a phase, counted from the host's phase start time through the measured
 * offset, and frozen at `heldAt` — when the room was held — so a hold is not counted away. */
export function useCountdown(
  durationMs: number,
  startedAt: number,
  clockOffsetMs = 0,
  active = true,
  answeredAt?: number,
  held = false,
  heldAt?: number
): number {
  // Read at render rather than kept in state: the tick only has to say when the next read is due,
  // and a stale copy would count the idle time a stopped room was not playing.
  useUiTick(active && !held);
  const now = Date.now();

  // The end of the clock is the answer where there is one, and stops there for good: a bank
  // that has been pressed is being looked at, not still being decided.
  const endsAt = answeredAt ?? startedAt + clockOffsetMs + durationMs;
  // A hold with no moment to freeze at — a client that has been told the room is paused but not
  // when — falls back to the last thing it knew, which is the running clock.
  if (held && heldAt !== undefined) {
    return Math.max(0, endsAt - heldAt);
  }
  return Math.max(0, endsAt - now);
}
