import { useEffect, useState } from 'preact/hooks';
import { GameConfig } from '@/Game';

/**
 * Remaining time of a phase, counted from the host's phase start time.
 *
 * `startedAt` is the host's clock, so it is converted through the clock offset
 * measured from the host. Counting from the moment a message arrived would give
 * a client that joined late, or was suspended and caught up, the full duration
 * again while everyone else was near the end.
 *
 * `active` stops the tick for a phase that has no clock to read, so a caller
 * that only wants a countdown while one phase is on is not waking the tab ten
 * times a second for the rest of the game to read a zero it already knows.
 */
export function useCountdown(
  durationMs: number,
  startedAt: number,
  clockOffsetMs = 0,
  active = true,
): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    // Read the clock on the way in rather than waiting out the first tick. `now` was
    // last written whenever the countdown last ran, and a phase that starts while the
    // tick is stopped would count the whole idle time as if it were phase time: a
    // three-second count-in opened four seconds after the last one would have shown
    // seven.
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), GameConfig.timing.uiTickMs);
    return () => clearInterval(id);
  }, [active]);

  return Math.max(0, durationMs - (now - (startedAt + clockOffsetMs)));
}
