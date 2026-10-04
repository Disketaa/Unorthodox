import { useEffect, useRef, useState } from 'preact/hooks';

/**
 * A thing on screen that rocks from side to side, the way someone standing shifts their weight.
 *
 * This is the characters' idle movement, lifted out of `Character`. A hook rather than a
 * component: the node it writes to must be the one carrying the layout already.
 */
export interface IdleMotion {
  tilt: number;
  range: number;
  sway: number;
  duration: number;
  steps: number;
  timing: string;
  offset: number;
}

/** The resting lean, in degrees either way. */
const MaxTiltDeg = 2;

/** How far it bobs, in pixels. Barely there on purpose: a thing that hops reads as bouncing, and a screen of them is busy rather than alive. The life comes from the swing instead. */
const MaxRangePx = 1;

/**
 * How far it swings sideways, in pixels. The movement that carries it, and only about a pixel.
 *
 * Absolute rather than a share of the thing's own size, so a small character and the game's
 * name swing the same distance.
 */
const MaxSwayPx = 1.5;

/** Slow, because a swing that repeats quickly reads as a vibration rather than as weight shifting. */
const MinDurationS = 2.4;
const MaxDurationS = 4.8;

/** Few steps, because the swing is already a slow movement and a fine-grained one would smooth it back into a tween. Two or three reads as a held pose on the turn. */
const MinSteps = 2;
const MaxSteps = 3;

/**
 * The four ways a stepped timing lands: which one snaps on arrival rather than on departure.
 *
 * Exported because the sway and a character's arrival are both stepped and should snap the same
 * ways; a second list would be a second set of habits.
 */
const TimingChoices = ['jump-none', 'jump-start', 'jump-end', 'jump-both'] as const;

/** A number anywhere in a range. */
function rollBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** A whole number in a range. */
function rollStepsBetween(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** One of the stepped timings, at random. */
export function rollTiming(): string {
  return TimingChoices[Math.floor(Math.random() * TimingChoices.length)] ?? 'jump-none';
}

/**
 * One thing's idle motion, rolled fresh.
 *
 * A row of them only looks alive if no two agree: each gets its own lean, swing width, tempo,
 * step count and place in the cycle. Held in state so a thing does not twitch on a re-render.
 */
function rollIdle(): IdleMotion {
  return {
    tilt: (Math.random() * 2 - 1) * MaxTiltDeg,
    range: rollBetween(MaxRangePx / 3, MaxRangePx),
    sway: (Math.random() * 2 - 1) * MaxSwayPx,
    duration: rollBetween(MinDurationS, MaxDurationS),
    steps: rollStepsBetween(MinSteps, MaxSteps),
    timing: rollTiming(),
    offset: Math.random(),
  };
}

/** The idle values, as finished CSS values. */
function idleProperties(motion: IdleMotion): [string, string][] {
  return [
    ['--Sway-Tilt', `${motion.tilt.toFixed(2)}deg`],
    ['--Sway-Range', `${motion.range.toFixed(2)}px`],
    ['--Sway-Sway', `${motion.sway.toFixed(2)}px`],
    ['--Sway-Duration', `${motion.duration.toFixed(2)}s`],
    ['--Sway-Timing', `steps(${motion.steps}, ${motion.timing})`],
    ['--Sway-Offset', motion.offset.toFixed(3)],
  ];
}

/**
 * A ref for the element that carries the sway, with the rolled values written onto it.
 *
 * The values change once per thing and cannot be known in CSS, and a style prop is not allowed.
 * The timings go over as whole `steps()` calls because the build strips a `var()` used inside.
 */
export function useSwayMotion<T extends HTMLElement>(): { current: T | null } {
  const ref = useRef<T>(null);
  const [motion] = useState(rollIdle);

  useEffect(() => {
    const node = ref.current;
    if (node === null) {
      return;
    }
    for (const [name, value] of idleProperties(motion)) {
      node.style.setProperty(name, value);
    }
  }, [motion]);

  return ref;
}