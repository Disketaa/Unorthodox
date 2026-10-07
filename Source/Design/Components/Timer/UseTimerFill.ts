import { RefObject } from 'preact';
import { useEffect } from 'preact/hooks';

/** The fill's width, the light layer's clip and its colour, written to the elements rather than
 * styled from render, since the transitions are what smooth a value changing every tick. The
 * colour is removed as well as written: a property left behind outlives the phase that set it. */
export function useTimerFill(
  rootRef: RefObject<HTMLElement>,
  barRef: RefObject<HTMLElement>,
  inkRef: RefObject<HTMLElement>,
  pct: number,
  tint?: string
): void {
  useEffect(() => {
    const bar = barRef.current;
    if (bar) {
      bar.style.width = `${pct}%`;
    }
    const ink = inkRef.current;
    if (ink) {
      ink.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    }
  }, [pct]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (tint === undefined) {
      root.style.removeProperty('--Timer-Fill');
      return;
    }
    root.style.setProperty('--Timer-Fill', tint);
  }, [tint]);
}
