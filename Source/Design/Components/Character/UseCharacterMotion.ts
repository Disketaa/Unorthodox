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
  popTilt: number;
  popOffsetX: number;
  popOffsetY: number;
  popSteps: number;
  popTiming: string;
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

/** The angle it is cocked over at on its first frame, in degrees. */
const MaxPopTiltDeg = 5;

/**
 * How far off its resting place it appears, in pixels. This is the "arrives from
 * its own direction" part: a pop from exactly the same point every time looks
 * like a system animation, and a pop from slightly different places and angles
 * looks like nine characters turning up.
 */
const MaxPopOffsetPx = 7;

/** Steps in the pop. Few, so each held shape is a real frame of the flipbook. */
const MinPopSteps = 5;
const MaxPopSteps = 8;

/**
 * The nearest a character arrives from, in pixels.
 *
 * Never zero, because an arrival from exactly its resting place is not an arrival
 * at all, and because the sign of that offset is what says the character dropped in
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

/** One of the stepped timings, at random. */
function rollTiming(): string {
  return TimingChoices[Math.floor(Math.random() * TimingChoices.length)] ?? 'jump-none';
}

/** One instance's motion, rolled fresh. */
function rollMotion(): CharacterMotion {
  return {
    tilt: (Math.random() * 2 - 1) * MaxTiltDeg,
    range: rollBetween(MaxRangePx / 3, MaxRangePx),
    sway: (Math.random() * 2 - 1) * MaxSwayPx,
    duration: rollBetween(MinDurationS, MaxDurationS),
    steps: rollStepsBetween(MinSteps, MaxSteps),
    timing: rollTiming(),
    offset: Math.random(),
    popTilt: (Math.random() * 2 - 1) * MaxPopTiltDeg,
    popOffsetX: (Math.random() * 2 - 1) * MaxPopOffsetPx,
    // Always from slightly above, and never from nowhere: a character dropping into
    // place from overhead reads as arriving, where from below reads as surfacing.
    popOffsetY: -rollBetween(MinPopOffsetYAbsPx, MaxPopOffsetPx),
    popSteps: rollStepsBetween(MinPopSteps, MaxPopSteps),
    popTiming: rollTiming(),
  };
}

/** The idle values, as finished CSS values. */
function idleProperties(motion: CharacterMotion): [string, string][] {
  return [
    ['--Character-Motion-Tilt', `${motion.tilt.toFixed(2)}deg`],
    ['--Character-Motion-Range', `${motion.range.toFixed(2)}px`],
    ['--Character-Motion-Sway', `${motion.sway.toFixed(2)}px`],
    ['--Character-Motion-Duration', `${motion.duration.toFixed(2)}s`],
    ['--Character-Motion-Timing', `steps(${motion.steps}, ${motion.timing})`],
    ['--Character-Motion-Offset', motion.offset.toFixed(3)],
  ];
}

/**
 * The pop's values, for the `Pop` primitive to read.
 *
 * Only the parts that make one character differ from another: where it comes
 * from and how it is cocked when it gets there. The squash itself and the
 * duration belong to the primitive, so every reaction is the same movement.
 */
function popProperties(motion: CharacterMotion): [string, string][] {
  return [
    ['--Pop-Tilt', `${motion.popTilt.toFixed(2)}deg`],
    ['--Pop-OffsetX', `${motion.popOffsetX.toFixed(2)}px`],
    ['--Pop-OffsetY', `${motion.popOffsetY.toFixed(2)}px`],
    ['--Pop-Timing', `steps(${motion.popSteps}, ${motion.popTiming})`],
  ];
}

/**
 * A ref for the element that carries the motion, with the rolled values written
 * onto it as custom properties.
 *
 * The values change once per character and cannot be known in CSS, and a style
 * prop is not allowed, so they are set on the node the way the paper overlay sets
 * its own drift. Expressed as finished values rather than numbers, so the
 * stylesheet still decides what they mean. The timings are passed as whole
 * `steps()` calls because the build strips a `var()` used *inside* the function,
 * which would leave an invalid timing function and silently cancel the animation.
 *
 * The `Pop` values sit on this same node, so the primitive below picks them up by
 * inheritance. That is what lets one mechanism serve every reaction while each
 * character still brings its own.
 */
export function useCharacterMotion(): { current: HTMLSpanElement | null } {
  const ref = useRef<HTMLSpanElement>(null);
  const [motion] = useState(rollMotion);

  useEffect(() => {
    const node = ref.current;
    if (node === null) {
      return;
    }
    for (const [name, value] of [...idleProperties(motion), ...popProperties(motion)]) {
      node.style.setProperty(name, value);
    }
  }, [motion]);

  return ref;
}
