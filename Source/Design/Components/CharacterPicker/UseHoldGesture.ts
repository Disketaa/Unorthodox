import { RefObject } from 'preact';
import { useEffect } from 'preact/hooks';
import { SpeedTracker } from './MotionSample';
import type { Momentum } from './UseMomentum';

/** How long the pointer must rest before the row follows it. */
export const HoldMs = 250;
/** Movement before the hold completes, which cancels it and leaves the row alone. */
export const SlopPx = 6;
/**
 * Speed, in pixels per millisecond, at which a moving pointer is a flick and not a
 * slow, careful adjustment.
 *
 * A flick has already made its intent clear by the time it is fast, and it is
 * usually over before the hold has completed, so without this a sharp throw would
 * cancel the hold and then do nothing at all. A slow drag over the same distance
 * is still a drag-in-progress, and cancelling it is the right call, because that
 * is the movement a person makes when they are about to let go of a tap.
 */
const FlickSpeed = 0.35;

export interface DragState {
  originX: number;
  originScroll: number;
  held: boolean;
  dragging: boolean;
  /** Set once a drag has happened, so the click it ends in can be swallowed. */
  suppress: boolean;
  /** Recent pointer positions, for working out how fast it is going. */
  speed: SpeedTracker;
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
    held: false,
    dragging: false,
    suppress: false,
    speed: new SpeedTracker(),
  };
}

/** Whether a moving pointer has decided this is a drag after all. */
function becomesDrag(gesture: HoldGesture, moved: number): boolean {
  if (Math.abs(moved) <= SlopPx) {
    return false;
  }
  return Math.abs(gesture.state.current.speed.velocity()) >= FlickSpeed;
}

/**
 * Follows the pointer once the hold is up or the movement has become a flick.
 *
 * Before either of those it only watches, so an ordinary tap and an ordinary
 * finger swipe keep their normal meaning: the tap chooses a character, the swipe
 * scrolls the page.
 */
export function pointerMove(gesture: HoldGesture, event: PointerEvent): void {
  const current = gesture.state.current;
  current.speed.add(event.clientX, event.timeStamp);
  const moved = event.clientX - current.originX;
  if (!current.held && !becomesDrag(gesture, moved)) {
    if (Math.abs(moved) > SlopPx) window.clearTimeout(gesture.timer.current);
    return;
  }
  if (!current.held) {
    window.clearTimeout(gesture.timer.current);
    current.held = true;
    current.dragging = true;
    gesture.setDragging(true);
  }
  const element = gesture.track.current;
  if (!element) return;
  element.scrollLeft = current.originScroll - moved;
}

/** Lets go: the row carries on with the speed it had, and swallows its click. */
export function pointerUp(gesture: HoldGesture): void {
  window.clearTimeout(gesture.timer.current);
  gesture.release();
  if (!gesture.state.current.dragging) return;
  gesture.state.current.dragging = false;
  gesture.state.current.suppress = true;
  gesture.setDragging(false);
  gesture.momentum.release(gesture.state.current.speed.velocity());
}

/** The pending hold, cancelled if the row goes away first. */
export function useHoldCleanup(timer: { current: number }): void {
  useEffect(() => () => window.clearTimeout(timer.current), []);
}
