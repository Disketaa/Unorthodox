import { useEffect, useRef, useState } from 'preact/hooks';

/**
 * A row of characters only looks alive if no two of them agree: each gets its
 * own resting lean, swing width, tempo, step count and place in the cycle, so
 * they move like a crowd rather than like one item copied nine times. Held in
 * state rather than recomputed, so a character keeps its own motion for as long
 * as it is on screen and does not twitch when something else re-renders.
 */
export interface CharacterMotion {
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
 * How far it bobs, in pixels. Barely there on purpose: a character that hops
 * reads as bouncing, and a screen of them is busy rather than alive. The life
 * comes from the swing instead, which is a slower movement the eye reads as
 * shifting weight.
 */
const MaxRangePx = 1;

/**
 * How far it swings sideways, in pixels. This is the movement that carries it,
 * and it is only a pixel or so: enough that the weight shift is there if you
 * watch for it, small enough that a row of nine reads as settled rather than as
 * twitching. Anything more and the lobby draws the eye to the artwork instead of
 * to the room code.
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
 * would smooth it back into a tween. Two or three reads as a held pose on the
 * turn, which is what makes it look drawn.
 */
const MinSteps = 2;
const MaxSteps = 3;

/**
 * The four ways a stepped timing can land. Which one a character gets changes
 * whether it snaps on arrival or on departure, which is a lot of the character
 * of the movement.
 */
const TimingChoices = ['jump-none', 'jump-start', 'jump-end', 'jump-both'] as const;

/** A whole number in a range, as a fraction of the range. */
function rollBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** One instance's motion, rolled fresh. */
function rollMotion(): CharacterMotion {
  const stepSpan = MaxSteps - MinSteps + 1;
  return {
    tilt: (Math.random() * 2 - 1) * MaxTiltDeg,
    range: rollBetween(MaxRangePx / 3, MaxRangePx),
    sway: (Math.random() * 2 - 1) * MaxSwayPx,
    duration: rollBetween(MinDurationS, MaxDurationS),
    steps: MinSteps + Math.floor(Math.random() * stepSpan),
    timing: TimingChoices[Math.floor(Math.random() * TimingChoices.length)] ?? 'jump-none',
    offset: Math.random(),
  };
}

/**
 * A ref for the element that carries the motion, with the rolled values written
 * onto it as custom properties.
 *
 * The values change once per character and cannot be known in CSS, and a style
 * prop is not allowed, so they are set on the node the way the paper overlay sets
 * its own drift. Expressed as finished values rather than numbers, so the
 * stylesheet still decides what they mean. The timing is passed as a whole
 * `steps()` call because the build strips a `var()` used *inside* the function,
 * which would leave an invalid timing function and silently cancel the animation.
 */
export function useCharacterMotion(): { current: HTMLSpanElement | null } {
  const ref = useRef<HTMLSpanElement>(null);
  const [motion] = useState(rollMotion);

  useEffect(() => {
    const node = ref.current;
    if (node === null) {
      return;
    }
    const style = node.style;
    style.setProperty('--Character-Motion-Tilt', `${motion.tilt.toFixed(2)}deg`);
    style.setProperty('--Character-Motion-Range', `${motion.range.toFixed(2)}px`);
    style.setProperty('--Character-Motion-Sway', `${motion.sway.toFixed(2)}px`);
    style.setProperty('--Character-Motion-Duration', `${motion.duration.toFixed(2)}s`);
    style.setProperty('--Character-Motion-Timing', `steps(${motion.steps}, ${motion.timing})`);
    style.setProperty('--Character-Motion-Offset', motion.offset.toFixed(3));
  }, [motion]);

  return ref;
}
