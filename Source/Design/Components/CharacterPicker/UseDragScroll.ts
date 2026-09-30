import { RefObject } from 'preact';
import { useCallback, useRef, useState } from 'preact/hooks';
import { useMomentum } from './UseMomentum';
import {
  DragState,
  HoldGesture,
  HoldMs,
  idleDrag,
  pointerMove,
  pointerUp,
  useHoldCleanup,
} from './UseHoldGesture';

export interface DragScroll {
  dragging: boolean;
  onPointerDown: (event: PointerEvent) => void;
  onPointerUp: (event: PointerEvent) => void;
  /** True when the click after a drag must not choose a character. */
  suppressClick: () => boolean;
}

/**
 * Drags a row sideways after the pointer has been held on it, then lets go with
 * some momentum.
 *
 * The hold is what keeps this from stealing ordinary taps and swipes: the row
 * only starts following the pointer once it has clearly become a grab. The
 * momentum is the playful part, in `UseMomentum`.
 *
 * The move and release listeners live on the window rather than using pointer
 * capture. Capture keeps a gesture alive off the row, but it also retargets the
 * click that ends the gesture to the capturing element, which silently stopped
 * the character buttons from ever being pressed.
 */
export function useDragScroll(track: RefObject<HTMLDivElement>): DragScroll {
  const state = useRef<DragState>(idleDrag());
  const timer = useRef(0);
  const [dragging, setDragging] = useState(false);
  const detach = useRef<() => void>(undefinedGesture);
  const gesture = gestureParts(track, state, timer, detach, setDragging);
  const onPointerDown = useCallback(
    (event: PointerEvent) => beginGesture(gesture, detach, event),
    [gesture, detach]
  );
  const onPointerUp = useCallback(() => pointerUp(gesture), [gesture]);
  const suppressClick = useSuppressClick(state);
  useHoldCleanup(timer);

  return { dragging, onPointerDown, onPointerUp, suppressClick };
}

function undefinedGesture(): void {
  return;
}

/** Everything the three handlers share, assembled once per render. */
function gestureParts(
  track: RefObject<HTMLDivElement>,
  state: { current: DragState },
  timer: { current: number },
  detach: { current: () => void },
  setDragging: (value: boolean) => void
): HoldGesture {
  return {
    track,
    state,
    momentum: useMomentum(track),
    timer,
    release: () => detach.current(),
    setDragging,
  };
}

/**
 * Starts a press: listens on the window and waits for the hold to complete.
 *
 * The window is where the move and release go, so a drag that leaves the row keeps
 * working and, more importantly, the click that ends the press still belongs to
 * the button it started on.
 */
function beginGesture(
  gesture: HoldGesture,
  detach: { current: () => void },
  event: PointerEvent
): void {
  const element = gesture.track.current;
  if (!element) return;
  window.clearTimeout(gesture.timer.current);
  detach.current();
  gesture.momentum.stop();
  gesture.state.current = idleDrag();
  gesture.state.current.originX = event.clientX;
  gesture.state.current.originScroll = element.scrollLeft;
  gesture.state.current.lastX = event.clientX;
  gesture.state.current.lastAt = event.timeStamp;
  listenForGesture(gesture, detach);
  gesture.timer.current = window.setTimeout(() => {
    gesture.state.current.held = true;
    gesture.state.current.dragging = true;
    gesture.setDragging(true);
  }, HoldMs);
}

/**
 * Watches the window for the rest of the gesture.
 *
 * The teardown goes through a ref rather than onto the gesture object, because the
 * gesture is rebuilt on every render: a teardown stored on it would be the one from
 * the render that started the gesture, and the listeners themselves would never
 * come off.
 */
function listenForGesture(
  gesture: HoldGesture,
  detach: { current: () => void }
): void {
  const move = (event: PointerEvent) => pointerMove(gesture, event);
  const up = () => pointerUp(gesture);
  detach.current = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    detach.current = undefinedGesture;
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
}

/** Reads and clears the flag that says the click came out of a drag. */
function useSuppressClick(state: { current: DragState }): () => boolean {
  return useCallback(() => {
    const suppress = state.current.suppress;
    state.current.suppress = false;
    return suppress;
  }, [state]);
}
