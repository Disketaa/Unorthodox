import { useEffect, useState } from 'preact/hooks';
import { GameConfig } from '@/Game';

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
  const [now, setNow] = useState(() => Date.now());

  // A held room stops being ticked rather than being ticked slowly, for the reason above.
  useEffect(() => {
    if (!active || held) return;
    // Read the clock on the way in rather than waiting out the first tick: a phase starting while
    // the tick is stopped would count the whole idle time as phase time.
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), GameConfig.timing.uiTickMs);
    return () => clearInterval(id);
  }, [active, held]);

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
