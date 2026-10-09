import { useCallback, useEffect, useRef } from 'preact/hooks';
import type { TargetedPointerEvent } from 'preact';

/** How long a key must be held before it repeats, and how often it then does. The same shape as
 * a desktop keyboard's own: one delay, then a fixed rate, and not a ramp — a rate that moved
 * would make a held key unreadable as it sped up. */
export const HoldDelayMs = 400;
export const HoldRepeatMs = 70;

export interface HoldRepeat {
  onPointerDown: (event: TargetedPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  /** Replaces the button's own click, so a tap and a hold are one press and not two. */
  onClick: () => void;
}

/** A key that keeps going while it is held, for a finger rather than a hand: erasing a word one
 * letter at a time is the slowest thing on a phone, and there is no keyboard under the thumb to
 * do it instead. The first press is left to the button's own click, so a tap cannot fire twice. */
export function useHoldRepeat(onFire: () => void): HoldRepeat {
  const timer = useRef<number | undefined>(undefined);
  const repeating = useRef(false);
  const fire = useRef(onFire);
  fire.current = onFire;

  const stop = useCallback(() => {
    if (timer.current !== undefined) window.clearTimeout(timer.current);
    timer.current = undefined;
  }, []);

  const start = useCallback(
    (event: TargetedPointerEvent<HTMLButtonElement>) => {
      stop();
      // Captured so a finger that slides off the key still releases it: without capture the
      // pointerup lands on whatever is under the finger instead, the timer is never cleared, and
      // the key keeps erasing after the finger has already lifted.
      event.currentTarget.setPointerCapture(event.pointerId);
      timer.current = window.setTimeout(function repeat() {
        repeating.current = true;
        fire.current();
        timer.current = window.setTimeout(repeat, HoldRepeatMs);
      }, HoldDelayMs);
    },
    [stop]
  );

  useEffect(() => stop, [stop]);

  return {
    onPointerDown: start,
    onPointerUp: stop,
    onPointerCancel: stop,
    onClick: () => {
      if (repeating.current) {
        repeating.current = false;
        return;
      }
      fire.current();
    },
  };
}
