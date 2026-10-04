import { useEffect, useRef, useState } from 'preact/hooks';

/**
 * A thing on screen that rocks from side to side, the way someone standing shifts their weight.
 *
 * This is the characters' idle movement, lifted out of `Character`. A hook and a stylesheet rather
 * than a component, because the node it writes to must be the one already carrying the layout.
 *
 * Generic over the element rather than fixed to a span: the characters ride a span and a theme card
 * rides a button, and a ref typed to one is a cast away at the other.
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

/**
 * How far it bobs, in pixels. Barely there on purpose: a thing that hops reads as
 * bouncing, and a screen of them is busy rather than alive. The life comes from the
 * swing instead, which is a slower movement the eye reads as shifting weight.
 */
const MaxRangePx = 1;

/**
 * How far it swings sideways, in pixels. This is the movement that carries it, and it
 * is only a pixel or so: enough that the weight shift is there if you watch for it,
 * small enough that a row of nine reads as settled rather than as twitching. Anything
 * more and the lobby draws the eye to the artwork instead of to the room code.
 *
 * Absolute rather than a share of the thing's own size, so a small character and the
 * game's name swing the same distance. They are the same movement, and a movement
 * that scaled with its subject would be a second one wearing the first's numbers.
 */
const MaxSwayPx = 1.5;

/**
 * Slow, because a swing that repeats quickly reads as a vibration rather than as
 * someone shifting their weight. The ends stay well short of a twitch.
 */
const MinDurationS = 2.4;
const MaxDurationS = 4.8;

/**
 * Few steps, because the swing is already a slow movement and a fine-grained one
 * would smooth it back into a tween. Two or three reads as a held pose on the turn,
 * which is what makes it look drawn.
 */
const MinSteps = 2;
const MaxSteps = 3;

/**
 * The four ways a stepped timing can land. Which one a movement gets changes whether
 * it snaps on arrival or on departure, which is a lot of the character of it.
 *
 * Exported because the sway and a character's arrival are both stepped movements and
 * should snap the same set of ways; a second list would be a second set of habits.
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
 * A row of them only looks alive if no two agree: each gets its own resting lean,
 * swing width, tempo, step count and place in the cycle, so they move like a crowd
 * rather than like one item copied nine times. Held in state rather than recomputed,
 * so a thing keeps its own motion for as long as it is on screen and does not twitch
 * when something else re-renders.
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
 * A ref for the element that carries the sway, with the rolled values written onto it
 * as custom properties.
 *
 * The values change once per thing and cannot be known in CSS, and a style prop is not
 * allowed, so they are set on the node the way the paper overlay sets its own drift.
 * Expressed as finished values rather than numbers, so the stylesheet still decides
 * what they mean. The timings are passed as whole `steps()` calls because the build
 * strips a `var()` used *inside* the function, which would leave an invalid timing
 * function and silently cancel the animation.
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