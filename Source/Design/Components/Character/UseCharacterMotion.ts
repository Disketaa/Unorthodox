import { useEffect, useState } from 'preact/hooks';
import { rollTiming, useSwayMotion } from '@/Design/Primitives';

/** The values one character brings to a reaction: where it comes from and how it is cocked.
 * Everything here is what makes one character differ from another. The squash, the duration and
 * the idle sway belong to `Pop` and `useSwayMotion`. */
export interface CharacterPop {
  tilt: number;
  offsetX: number;
  offsetY: number;
  steps: number;
  timing: string;
}

/** The angle it is cocked over at on its first frame, in degrees. */
const MaxPopTiltDeg = 5;

/** How far off its resting place it appears, in pixels. The "arrives from its own direction"
 * part: a pop from exactly the same point every time looks like a system animation. */
const MaxPopOffsetPx = 7;

/** Steps in the pop. Few, so each held shape is a real frame of the flipbook. */
const MinPopSteps = 5;
const MaxPopSteps = 8;

/** The nearest a character arrives from, in pixels. Never zero: an arrival from its own resting
 * place is not an arrival, and the sign of the offset is what says the character dropped in
 * rather than surfaced. */
const MinPopOffsetYAbsPx = 1.2;

/** A number anywhere in a range. */
function rollBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** A whole number in a range. */
function rollStepsBetween(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** One character's arrival, rolled fresh. */
function rollPop(): CharacterPop {
  return {
    tilt: (Math.random() * 2 - 1) * MaxPopTiltDeg,
    offsetX: (Math.random() * 2 - 1) * MaxPopOffsetPx,
    // Always from slightly above, and never from nowhere: a character dropping into
    // place from overhead reads as arriving, where from below reads as surfacing.
    offsetY: -rollBetween(MinPopOffsetYAbsPx, MaxPopOffsetPx),
    steps: rollStepsBetween(MinPopSteps, MaxPopSteps),
    timing: rollTiming(),
  };
}

/** The arrival, as the finished values `Pop` reads. */
function popProperties(motion: CharacterPop): [string, string][] {
  return [
    ['--Pop-Tilt', `${motion.tilt.toFixed(2)}deg`],
    ['--Pop-OffsetX', `${motion.offsetX.toFixed(2)}px`],
    ['--Pop-OffsetY', `${motion.offsetY.toFixed(2)}px`],
    ['--Pop-Timing', `steps(${motion.steps}, ${motion.timing})`],
  ];
}

/** The ref for a character's own node, carrying its idle sway and its arrival. Two effects write
 * one node: the sway belongs to everything on the page, the arrival to a character. Sharing the
 * node is what lets `Pop` inherit the arrival while the sway runs. */
export function useCharacterMotion(): { current: HTMLSpanElement | null } {
  const motionRef = useSwayMotion();
  const [motion] = useState(rollPop);

  useEffect(() => {
    const node = motionRef.current;
    if (node === null) {
      return;
    }
    for (const [name, value] of popProperties(motion)) {
      node.style.setProperty(name, value);
    }
  }, [motion, motionRef]);

  return motionRef;
}
