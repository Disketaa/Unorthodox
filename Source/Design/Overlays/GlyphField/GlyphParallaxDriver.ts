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

/** How much of the page scroll the field answers. Well under one: it is a backdrop, not a scene. */
const ScrollRatio = 0.12;

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

/** A whole value's worth of travel on either axis, in pixels. */
function bound(value: number, half: number): number {
  if (half <= 0) {
    return 0;
  }
  return Math.max(-1, Math.min(1, value / half)) * ShiftMaxPx;
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
    current = {
      x: eased(current.x, bound(target.x, halfWidth), deltaS),
      y: eased(current.y, bound(target.y, halfHeight) - window.scrollY * ScrollRatio, deltaS),
    };
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