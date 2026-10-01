import { useEffect, useRef } from 'preact/hooks';
import { GameConfig } from '@/Game';
import { playSound } from '@/Design/Sounds';
import { useCountdown } from './UseCountdown';
import type { SessionPhase } from './UseSessionPhase';

/**
 * How far apart the count-in's notes are, in semitones.
 *
 * Two steps from the first number to the last, which puts the last note a quarter
 * above the first: three notes a listener can put in order, and the last one saying
 * "now". A fifth would have been the start of a different tune rather than the end of
 * this one.
 */
const PitchStepSemitones = 2;

/** The highest number the count reaches, and so the first note, which is the base one. */
const FirstNumber = 3;

/** How the room is getting on with counting itself in. */
export interface StartCount {
  /** The shade over the room, before there is a number to show. */
  veiling: boolean;
  /** The number on screen, or null while there is only the shade. */
  count: number | null;
}

/** The count-in is over the moment it is asked for and not asked for. */
export const NoCount: StartCount = { veiling: false, count: null };

/**
 * Where the room is in the count-in, counted from the host's start of the writing
 * phase rather than from a timer started here.
 *
 * From the host's own clock, so the whole room is at the same point at the same
 * moment: a client whose message arrived late joins the count where everybody else
 * already is, rather than being given the whole count-in again. That is the same
 * clock the round itself is counted by, which is what makes the two agree.
 *
 * Once per room and never again, because it counts the game in and not each round:
 * every later writing phase starts with players already writing, and a count-in over
 * the top of one would take the first seconds of every answer from them.
 *
 * The note goes on the number changing rather than on a timer of its own, so a tab
 * that was throttled while it was hidden plays one note rather than a burst of the
 * three it missed, and it climbs with the count rather than wobbling.
 */
export function useStartCountdown(phase: SessionPhase): StartCount {
  const { phase: name, phaseStartedAt, clockOffsetMs } = phase;
  const countedRef = useRef(false);
  const counting = name === 'Writing' && !countedRef.current;
  const { startVeilMs, startCountdownMs } = GameConfig.timing;
  const remainingMs = useCountdown(
    startVeilMs + startCountdownMs,
    phaseStartedAt,
    clockOffsetMs,
    counting,
  );
  // How far into the count-in the room is. The shade takes the first stretch of it and
  // the numbers the second, so this is the one measurement both are read from: the
  // veil is up while the shade still has time to run, and the first number appears
  // exactly when it has finished.
  const elapsedMs = startVeilMs + startCountdownMs - remainingMs;
  // How much of the count is left, which is the number on screen. Counted down rather
  // than up, since the room is counting towards the round and not away from it.
  const leftMs = startCountdownMs - (elapsedMs - startVeilMs);
  // Capped at the first number, so a host whose clock is a little ahead of its own
  // countdown cannot open on a number nobody was ever going to be shown. And not before
  // the shade has finished coming up, which is the whole of what the veil is for.
  const count =
    counting && elapsedMs >= startVeilMs && leftMs > 0
      ? Math.min(FirstNumber, Math.ceil(leftMs / 1000))
      : null;
  const playedRef = useRef<number | null>(null);

  useEffect(() => {
    if (name === 'Writing' && remainingMs <= 0) {
      countedRef.current = true;
    }
  }, [name, remainingMs]);

  useEffect(() => {
    if (count === null) {
      playedRef.current = null;
      return;
    }
    if (playedRef.current === count) return;
    playedRef.current = count;
    playSound('Pling', (FirstNumber - count) * PitchStepSemitones);
  }, [count]);

  if (!counting || remainingMs <= 0) return NoCount;
  return { veiling: count === null, count };
}
