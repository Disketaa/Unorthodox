import { useEffect, useRef, useState } from 'preact/hooks';
import { GameConfig } from '@/Game';

/** Re-renders this component on the room's UI tick, paced by `performance.now()` rather than by
 * the timer that woke it: a run whose timers are sped up would otherwise repaint once a
 * millisecond, which no display can show. */
export function useUiTick(active = true): void {
  const [, setTick] = useState(0);
  // Kept per subscriber rather than shared: a shared beat would let whichever reader is woken
  // first take it, and the rest would never see a frame of their own.
  const paintedAt = useRef(-Infinity);

  useEffect(() => {
    if (!active) return;
    // Due at once, so a phase starting while the tick was stopped is drawn on the frame it starts.
    paintedAt.current = -Infinity;
    const id = setInterval(() => {
      const now = performance.now();
      if (now - paintedAt.current < GameConfig.timing.uiTickMs) return;
      paintedAt.current = now;
      setTick((tick) => tick + 1);
    }, GameConfig.timing.uiTickMs);
    return () => clearInterval(id);
  }, [active]);
}
