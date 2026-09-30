import { useEffect, useState } from 'preact/hooks';
import { GameConfig } from '@/Game';

/**
 * Remaining time of a phase, counted locally from the moment the phase message
 * arrived. Device clocks are not synced, so every client starts its own count.
 */
export function useCountdown(durationMs: number, startedAt: number): number {
  const [now, setNow] = useState(() => performance.now());

  useEffect(() => {
    const id = setInterval(() => setNow(performance.now()), GameConfig.timing.uiTickMs);
    return () => clearInterval(id);
  }, []);

  return Math.max(0, durationMs - (now - startedAt));
}
