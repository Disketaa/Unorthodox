/**
 * How quickly the field catches up with the target, per 60th of a second.
 *
 * Low on purpose and applied as a frame-rate independent smoothing, so the
 * field never arrives: it eases toward the pointer for a beat after the pointer
 * has stopped. Under a tenth is roughly a third of a second of follow-through,
 * which is what makes the movement read as weight rather than as a value being
 * written.
 */
const CatchUp = 0.05;

/**
 * How many pixels the field may travel from its resting place at the extreme
 * edge of the screen.
 *
 * Barely more than a nudge, because the field is under the paper and behind the
 * text: enough for the marks to answer the pointer if you watch for them, small
 * enough that nothing in the margins appears to be attached to the cursor.
 */
const ShiftMaxPx = 28;

/**
 * How much page scroll counts as the field having spread all the way, in pixels.
 *
 * A length rather than a share, because a share of the page grows without limit
 * and would carry the marks off the screen entirely. Past this much scrolling the
 * field is as spread as it ever gets and scrolling further does nothing.
 */
const ScrollRangePx = 600;

/**
 * How far the field may spread outwards from its resting place, in pixels.
 *
 * Small, and the point of it is the direction: scrolling pushes the marks away
 * from the middle rather than sliding them across it, so reading down the page
 * opens the centre up instead of filling it. A field that leaned inward on every
 * scroll was the thing that made the middle cramped on a long page.
 */
const SpreadMaxPx = 34;

/** Where the field is heading, in pixels, on each axis. */
export interface GlyphTarget {
  x: number;
  y: number;
}

export interface GlyphParallaxDriver {
  aim: (target: GlyphTarget) => void;
  stop: () => void;
}

/** The value easing toward the target, one frame on, in pixels. */
function eased(value: number, target: number, deltaS: number): number {
  const factor = 1 - Math.pow(1 - CatchUp, deltaS * 60);
  return value + (target - value) * factor;
}

/** A whole value's worth of travel on an axis, in pixels, and never more than a cap. */
function bound(value: number, half: number, cap: number = ShiftMaxPx): number {
  if (half <= 0) {
    return 0;
  }
  return Math.max(-1, Math.min(1, value / half)) * cap;
}

/**
 * How far the page is pinched, as a plain ratio.
 *
 * Only pinch, and deliberately not the browser's own zoom level. A browser does
 * not report its zoom, so the only way to infer it is to compare the device
 * pixel ratio now against the one the page happened to load at, which makes the
 * whole field depend on the zoom the player was already using when the page
 * opened. The same page then looks different depending on that, and a reload at
 * another zoom silently changes every mark.
 *
 * Pinch is reported directly and is the same on every device, so the field
 * compensates for that and lets browser zoom do what it does to everything else
 * on the page. Clamped, because a pinch far from one would otherwise draw a mark
 * at a size nothing else on the screen is at.
 */
const MaxPinch = 2;

function readZoom(): number {
  const pinch = window.visualViewport?.scale;
  if (typeof pinch !== 'number' || pinch <= 0) {
    return 1;
  }
  return Math.min(pinch, MaxPinch);
}

/**
 * Drives the shared parallax offset, frame by frame.
 *
 * One `requestAnimationFrame` loop for the whole field, started once and left
 * running while the page is open. The events only move the target; nothing is
 * written on them, so a fast mouse or a flick-scroll cannot produce a fast
 * field. Writes happen on the frame the browser is already painting, at the
 * frame's own pace, which is why the easing is computed against real elapsed
 * time instead of being assumed to be 60fps.
 */
export function startGlyphParallax(node: HTMLDivElement): GlyphParallaxDriver {
  const target: GlyphTarget = { x: 0, y: 0 };
  let current: GlyphTarget = { x: 0, y: 0 };
  let previous = performance.now();
  let spread = 0;
  let frame = 0;

  const write = () => {
    node.style.setProperty('--Glyph-OffsetX', `${current.x.toFixed(2)}px`);
    node.style.setProperty('--Glyph-OffsetY', `${current.y.toFixed(2)}px`);
    node.style.setProperty('--Glyph-Zoom', readZoom().toFixed(3));
  };

  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    // Clamped so a tab returning from the background does not jump the field
    // across the screen in a single frame.
    const deltaS = Math.min((now - previous) / 1000, 0.05);
    previous = now;
    const halfWidth = window.innerWidth / 2;
    const halfHeight = window.innerHeight / 2;
    /*
     * The pointer moves the field as one piece, bounded on both axes.
     *
     * Scrolling does not move it at all along those axes. It writes a separate
     * spread value instead, which the two bands read in opposite directions, so
     * scrolling pushes the left band further left and the right band further
     * right. That is the whole behaviour: reading down the page opens the middle
     * up rather than carrying the marks across it.
     */
    current = {
      x: eased(current.x, bound(target.x, halfWidth), deltaS),
      y: eased(current.y, bound(target.y, halfHeight), deltaS),
    };
    spread = eased(spread, bound(window.scrollY, ScrollRangePx, SpreadMaxPx), deltaS);
    node.style.setProperty('--Glyph-Spread', `${spread.toFixed(2)}px`);
    write();
  };

  frame = requestAnimationFrame(tick);
  write();

  return {
    aim: (next) => {
      target.x = next.x;
      target.y = next.y;
    },
    stop: () => {
      if (frame !== 0) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    },
  };
}