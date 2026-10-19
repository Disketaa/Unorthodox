/** How far a value has travelled at a point in time, on the curve the stylesheet calls
 * `--Easing-Decelerate`: a figure leaving quickly and arriving gently. No overshoot, because a
 * number that passes its own figure and comes back reads as one that was wrong for a moment. */
export function decelerate(t: number): number {
  return bezier(0.2, 1, Math.min(1, Math.max(0, t)));
}

/** `cubic-bezier(x1, y1, x2, y2)` from an x on the timeline, for the two handles this project
 * eases with — the first at zero, which is what makes the curves start at full speed. The
 * parameter producing a given x is found by bisection, since x does not rise in step with it. */
function bezier(x2: number, y2: number, x: number): number {
  let low = 0;
  let high = 1;
  for (let pass = 0; pass < 20; pass += 1) {
    const mid = (low + high) / 2;
    if (horizontallyAt(x2, mid) < x) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return verticallyAt(y2, (low + high) / 2);
}

function horizontallyAt(x2: number, s: number): number {
  return 3 * (1 - s) * s * s * x2 + s * s * s;
}

function verticallyAt(y2: number, s: number): number {
  return 3 * (1 - s) * s * s * y2 + s * s * s;
}
