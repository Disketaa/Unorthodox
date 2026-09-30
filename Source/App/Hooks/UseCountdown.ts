import { useEffect, useState } from 'preact/hooks';
import { GameConfig } from '@/Game';

/**
 * Remaining time of a phase, counted from the host's phase start time.
 *
 * `startedAt` is the host's clock, so it is converted through the clock offset
 * measured from the host. Counting from the moment a message arrived would give
 * a client that joined late, or was suspended and caught up, the full duration
 * again while everyone else was near the end.
 */
export function useCountdown(durationMs: number, startedAt: number, clockOffsetMs = 0): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), GameConfig.timing.uiTickMs);
    return () => clearInterval(id);
  }, []);

  return Math.max(0, durationMs - (now - (startedAt + clockOffsetMs)));
}
