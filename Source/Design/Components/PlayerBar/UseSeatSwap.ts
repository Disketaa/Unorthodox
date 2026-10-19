import { useLayoutEffect, useRef } from 'preact/hooks';

/** How long a seat takes to travel to the place the count has moved it to. Long enough to follow
 * a seat across the bar, short enough that the next card's award is not queued behind this one. */
const SwapMs = 420;

/** The seat's own easing, read from the stylesheet rather than restated here, so the bar's
 * movement decelerates with everything else in the game and not at some other speed of its own. */
function easing(): string {
  const token = getComputedStyle(document.documentElement)
    .getPropertyValue('--Easing-Decelerate')
    .trim();
  return token === '' ? 'cubic-bezier(0, 0, 0.2, 1)' : token;
}

/** Whether the room has asked for less movement than this. A seat that should move and does not
 * is still in the right place; a seat that animates against that request is a seat the room
 * cannot stop. */
function still(): boolean {
  return (
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Seats that change places travel rather than jump: measure each one, let the row deal itself,
 * then put every seat back where it was drawn. Measured on X only — the bar is a row. Record
 * the place before the movement, so an award landing mid-travel measures against seats at rest. */
export function useSeatSwap(
  root: { current: HTMLElement | null },
  order: readonly string[]
): void {
  const last = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    const element = root.current;
    if (element === null) return;
    const seats = new Map<string, HTMLElement>();
    for (const child of Array.from(element.children)) {
      if (!(child instanceof HTMLElement)) continue;
      const id = child.getAttribute('data-seat');
      if (id !== null) seats.set(id, child);
    }
    const previous = last.current;
    const next = new Map<string, number>();
    for (const [id, node] of seats) next.set(id, node.offsetLeft);
    if (previous.size > 0 && !still()) {
      const curve = easing();
      for (const [id, node] of seats) {
        const from = previous.get(id);
        const to = next.get(id);
        if (from === undefined || to === undefined) continue;
        const travel = from - to;
        if (travel === 0) continue;
        node.animate(
          [{ transform: `translateX(${travel}px)` }, { transform: 'translateX(0px)' }],
          { duration: SwapMs, easing: curve, fill: 'backwards' }
        );
      }
    }
    last.current = next;
  }, [order.join('|')]);
}
