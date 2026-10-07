import { useEffect, useRef } from 'preact/hooks';
import { GameConfig } from '@/Game';
import { hasCountedIn, markCountedIn } from '@/Network/CountIn';
import { playSound } from '@/Design/Sounds';
import { useCountdown } from './UseCountdown';
import type { SessionPhase } from './UseSessionPhase';

/** How far apart the count-in's notes are, in semitones. Two steps from the first number to the
 * last: three notes a listener can put in order, the last of them saying "now". A fifth would
 * start a different tune rather than end this one. */
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

/** How long the whole count-in takes, shade and numbers together. */
function countInMs(): number {
  return GameConfig.timing.startVeilMs + GameConfig.timing.startCountdownMs;
}

/** The phase the count belongs to. The host pressing Start is the moment the room leaves the
 * lobby, and that is what the count announces: the shade goes up over the lobby they were just
 * looking at, and comes down on the theme they are about to pick. */
const CountInPhase = 'Choosing';

/** Where this device is in the count-in, once the room has started. Counted on this device's
 * clock from when it heard the phase, not the host's, and only once per room: a late arrival
 * counts in, a mid-round refresh does not. */
export function useStartCountdown(phase: SessionPhase, roomCode: string): StartCount {
  const countedRef = useRef(hasCountedIn(roomCode));
  const now = Date.now();
  const counting = phase.phase === CountInPhase && !countedRef.current;
  // Set while rendering rather than in an effect, because the count has to be running
  // on the very first render of the phase: an effect runs after the paint, and that
  // paint would be the theme cards with nothing counted over them.
  const startedRef = useRef<number | null>(null);
  if (counting && startedRef.current === null) {
    startedRef.current = now;
  }
  const { startVeilMs, startCountdownMs } = GameConfig.timing;
  const remainingMs = useCountdown(countInMs(), startedRef.current ?? now, 0, counting);
  // How far into the count-in this device is. The shade takes the first stretch of it and the
  // numbers the second, so both are read from this one measurement.
  const elapsedMs = countInMs() - remainingMs;
  // How much of the count is left, which is the number on screen. Counted down rather
  // than up, since the room is counting towards the round and not away from it.
  const leftMs = startCountdownMs - (elapsedMs - startVeilMs);
  // Capped at the first number, so a device that was slow to start does not open on a
  // number nobody was ever going to be shown. And not before the shade has finished
  // coming up, which is the whole of what the veil is for.
  const count =
    counting && elapsedMs >= startVeilMs && leftMs > 0
      ? Math.min(FirstNumber, Math.ceil(leftMs / 1000))
      : null;
  const playedRef = useRef<number | null>(null);

  useEffect(() => {
    // Marked once the whole count-in has run: the shade is a moment with no number, and treating
    // that as the end would stop the count before it began. Written down so a refresh counts.
    if (counting && remainingMs <= 0) {
      countedRef.current = true;
      markCountedIn(roomCode);
    }
  }, [counting, remainingMs, roomCode]);

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
