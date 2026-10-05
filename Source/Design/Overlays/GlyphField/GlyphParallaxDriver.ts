/** How quickly the field catches up with the target, per 60th of a second. Low enough that the
 * field trails the scroll rather than sitting on it, smoothed against real elapsed time so the
 * lag is the same flicked or crawled. */
const CatchUp = 0.06;

/** How much page scroll counts as the field having spread all the way, in pixels. A length
 * rather than a share, because a share of the page grows without limit and would carry the
 * marks off the screen entirely. */
const ScrollRangePx = 420;

/** How far the field may travel from its resting place, in pixels. Large, because scroll is the
 * only thing that moves this field and it has to read as the field travelling with the page
 * rather than wallpaper pinned to the screen. */
const SpreadMaxPx = 240;

export interface GlyphParallaxDriver {
  stop: () => void;
}

/** The value easing toward the target, one frame on, in pixels. */
function eased(value: number, target: number, deltaS: number): number {
  const factor = 1 - Math.pow(1 - CatchUp, deltaS * 60);
  return value + (target - value) * factor;
}

/** A whole value's worth of travel, as a ratio, and never more than a cap. */
function bound(value: number, range: number, cap: number): number {
  if (range <= 0) {
    return 0;
  }
  return Math.max(-1, Math.min(1, value / range)) * cap;
}

/** How far the page is pinched, as a plain ratio. Pinch only, and deliberately not browser zoom:
 * a browser does not report its zoom, so inferring it would make the field depend on the zoom
 * the player happened to be using when the page opened. */
const MaxPinch = 2;

function readZoom(): number {
  const pinch = window.visualViewport?.scale;
  if (typeof pinch !== 'number' || pinch <= 0) {
    return 1;
  }
  return Math.min(pinch, MaxPinch);
}

/** Drives the shared parallax offset, frame by frame. One loop for the whole field. Scroll is
 * read on the frame rather than subscribed to, so a flick-scroll cannot produce a fast field,
 * and writes happen on a frame the browser is painting. */
export function startGlyphParallax(node: HTMLDivElement): GlyphParallaxDriver {
  let previous = performance.now();
  let spread = 0;
  let frame = 0;

  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    // Clamped so a tab returning from the background does not jump the field
    // across the screen in a single frame.
    const deltaS = Math.min((now - previous) / 1000, 0.05);
    previous = now;
    // Scrolling writes one vertical spread value that both bands read the same way, so the marks
    // travel down the page with it. Nothing in the field ever moves on the horizontal axis.
    spread = eased(spread, bound(window.scrollY, ScrollRangePx, SpreadMaxPx), deltaS);
    node.style.setProperty('--Glyph-Spread', `${spread.toFixed(2)}px`);
    node.style.setProperty('--Glyph-Zoom', readZoom().toFixed(3));
  };

  frame = requestAnimationFrame(tick);
  node.style.setProperty('--Glyph-Spread', '0px');
  node.style.setProperty('--Glyph-Zoom', readZoom().toFixed(3));

  return {
    stop: () => {
      if (frame !== 0) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    },
  };
}
