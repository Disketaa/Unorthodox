/**
 * How quickly the field catches up with the target, per 60th of a second.
 *
 * Low enough that the field trails the scroll rather than sitting on it, and
 * applied as a frame-rate independent smoothing so the lag is the same whether
 * the page is being flicked or crawled. There is still follow-through left after
 * a scroll stops, which is what makes the movement read as weight rather than as
 * a value being written, but it is a few frames of it rather than the second and
 * a half a faint pointer-follow needed: a field meant to be felt on every scroll
 * cannot be one that is still catching up long after the next one starts.
 */
const CatchUp = 0.06;

/**
 * How much page scroll counts as the field having spread all the way, in pixels.
 *
 * A length rather than a share, because a share of the page grows without limit
 * and would carry the marks off the screen entirely. Past this much scrolling the
 * field is as spread as it ever gets and scrolling further does nothing.
 */
const ScrollRangePx = 420;

/**
 * How far the field may travel from its resting place, in pixels.
 *
 * Large, because scroll is the only thing that moves this field and it has to
 * read as the field travelling with the page rather than as wallpaper pinned to
 * the screen. At the deep end a mark crosses a good share of the viewport, which
 * is what separates it from the page it sits behind: the page slides under a
 * still frame, the marks slide under a still frame at their own speeds, and the
 * difference between those two speeds is the effect. Vertical, so it follows the
 * page's own direction rather than sliding across it.
 */
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
 * running while the page is open. Scroll is read on the frame rather than
 * subscribed to, so a flick-scroll cannot produce a fast field. Writes happen on
 * the frame the browser is already painting, at the frame's own pace, which is
 * why the easing is computed against real elapsed time instead of being assumed
 * to be 60fps.
 *
 * Scroll is the only thing that moves the field. The pointer is deliberately not
 * read: nothing here is affected by where a mouse is or by a finger dragging
 * across the screen, so the marks cannot be pulled around by a hand.
 */
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
    // Scrolling does not move the field sideways. It writes a single vertical
    // spread value, which both bands read the same way, so the marks travel
    // down the page with it. That is the whole behaviour: nothing in the field
    // ever moves on the horizontal axis.
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