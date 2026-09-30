import { RefObject } from 'preact';
import { useEffect } from 'preact/hooks';
import type { Momentum } from './UseMomentum';

/** How long the pointer must rest before the row follows it. */
export const HoldMs = 250;
/** Movement before the hold completes, which cancels it and leaves the row alone. */
export const SlopPx = 6;

export interface DragState {
  originX: number;
  originScroll: number;
  lastX: number;
  lastAt: number;
  velocity: number;
  held: boolean;
  dragging: boolean;
  /** Set once a drag has happened, so the click it ends in can be swallowed. */
  suppress: boolean;
}

/** Everything the three handlers share. */
export interface HoldGesture {
  track: RefObject<HTMLDivElement>;
  state: { current: DragState };
  momentum: Momentum;
  timer: { current: number };
  /** Detaches whatever the previous gesture attached to the window. */
  release: () => void;
  setDragging: (value: boolean) => void;
}

/** A gesture that has not started yet. */
export function idleDrag(): DragState {
  return {
    originX: 0,
    originScroll: 0,
    lastX: 0,
    lastAt: 0,
    velocity: 0,
    held: false,
    dragging: false,
    suppress: false,
  };
}

/**
 * Follows the pointer once the hold is up, remembering how fast it is going.
 *
 * Before the hold completes it only watches for movement, which cancels the hold,
 * so that an ordinary tap and an ordinary finger swipe keep their normal meaning:
 * the tap chooses a character, the swipe scrolls the page.
 */
export function pointerMove(gesture: HoldGesture, event: PointerEvent): void {
  const current = gesture.state.current;
  const moved = event.clientX - current.originX;
  if (!current.held) {
    if (Math.abs(moved) > SlopPx) window.clearTimeout(gesture.timer.current);
    return;
  }
  const element = gesture.track.current;
  if (!element) return;
  const elapsed = Math.max(1, event.timeStamp - current.lastAt);
  current.velocity = (current.lastX - event.clientX) / elapsed;
  element.scrollLeft = current.originScroll - moved;
  current.lastX = event.clientX;
  current.lastAt = event.timeStamp;
}

/** Lets go: the row carries on with the speed it had, and swallows its click. */
export function pointerUp(gesture: HoldGesture): void {
  window.clearTimeout(gesture.timer.current);
  gesture.release();
  if (!gesture.state.current.dragging) return;
  gesture.state.current.dragging = false;
  gesture.state.current.suppress = true;
  gesture.setDragging(false);
  gesture.momentum.release(gesture.state.current.velocity);
}

/** The pending hold, cancelled if the row goes away first. */
export function useHoldCleanup(timer: { current: number }): void {
  useEffect(() => () => window.clearTimeout(timer.current), []);
}
