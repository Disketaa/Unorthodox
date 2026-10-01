import { useEffect, useState } from 'preact/hooks';
import { rollTiming, useSwayMotion } from '@/Design/Primitives';

/**
 * The values one character brings to a reaction: where it comes from and how it is
 * cocked when it gets there.
 *
 * Everything here is what makes one character differ from another, and nothing here
 * is shared with anything else. The squash itself, the duration and the idle sway all
 * belong to `Pop` and to `useSwayMotion`, so every reaction and every resting pose is
 * the same movement however many things are on the screen.
 */
export interface CharacterPop {
  tilt: number;
  offsetX: number;
  offsetY: number;
  steps: number;
  timing: string;
}

/** The angle it is cocked over at on its first frame, in degrees. */
const MaxPopTiltDeg = 5;

/**
 * How far off its resting place it appears, in pixels. This is the "arrives from its
 * own direction" part: a pop from exactly the same point every time looks like a
 * system animation, and a pop from slightly different places and angles looks like
 * nine characters turning up.
 */
const MaxPopOffsetPx = 7;

/** Steps in the pop. Few, so each held shape is a real frame of the flipbook. */
const MinPopSteps = 5;
const MaxPopSteps = 8;

/**
 * The nearest a character arrives from, in pixels.
 *
 * Never zero, because an arrival from exactly its resting place is not an arrival at
 * all, and because the sign of that offset is what says the character dropped in
 * rather than surfacing. A roll that landed on zero would break both, so the value
 * starts above it rather than trusting the roll.
 */
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

/**
 * The ref for a character's own node, carrying its idle sway and its arrival.
 *
 * The two are written by two effects onto one node rather than one hook writing both,
 * because the sway belongs to every thing on the page and the arrival belongs to a
 * character: sharing the node is what lets `Pop` read the arrival by inheritance while
 * the sway runs on the same element.
 */
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