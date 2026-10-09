/** How long a key must be held before it starts repeating. Long enough that a tap is never
 * mistaken for a hold, short enough that a player reaching for a long word is not held up. */
export const RepeatDelayMs = 400;

/** The gap between the first repeats, before the ramp has moved it. */
export const RepeatStartMs = 220;

/** The gap the ramp settles at, which is as fast as a letter is worth repeating: faster than
 * this and the answer is a run of one letter and the key is meant to be read while it is held. */
export const RepeatFloorMs = 45;

/** How long the gap takes to fall from the start to the floor. A fixed rate, which is what a
 * desktop keyboard does, would make a held key either too slow to hold a word down or too fast
 * to read; ramping makes the first repeats slow and gets out of the way of the rest. */
export const RepeatRampMs = 900;

/** How long a pressed key stays drawn after it is released. A quick tap changes the state twice
 * in one frame, so the key would go from unpainted to painted to unpainted with no frame in
 * between: a press that reads as no animation at all. */
export const PressFlashMs = 110;

/** Repeat `fire` for as long as the key is held, starting slow and getting faster. Returns the
 * thing that stops it, which is what a key release and a lost window both have to call. */
export function repeatWhileHeld(fire: () => void): () => void {
  const startedAt = performance.now();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const step = () => {
    fire();
    const ramp = Math.min(1, (performance.now() - startedAt) / RepeatRampMs);
    timer = setTimeout(step, RepeatStartMs + (RepeatFloorMs - RepeatStartMs) * ramp);
  };

  timer = setTimeout(step, RepeatDelayMs);

  return () => {
    if (timer !== undefined) clearTimeout(timer);
  };
}
