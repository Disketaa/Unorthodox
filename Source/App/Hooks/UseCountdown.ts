import { useEffect, useState } from 'preact/hooks';
import { GameConfig } from '@/Game';

/** Remaining time of a phase, counted from the host's phase start time. `startedAt` is the
 * host's clock, converted through the measured offset: counting from when a message arrived
 * would give a late or resumed client the full duration again. */
export function useCountdown(
  durationMs: number,
  startedAt: number,
  clockOffsetMs = 0,
  active = true,
  answeredAt?: number,
  held = false
): number {
  const [now, setNow] = useState(() => Date.now());

  // A held room stops being ticked rather than being ticked slowly: the host moves the clock on by
  // the length of the hold when it lets go, so a countdown still falling here would show less than
  // the room has left and then land back where it started.
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
  return Math.max(0, endsAt - now);
}
