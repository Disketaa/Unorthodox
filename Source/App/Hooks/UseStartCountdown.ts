import { useEffect, useRef } from 'preact/hooks';
import { GameConfig } from '@/Game';
import { hasCountedIn, markCountedIn } from '@/Network/CountIn';
import { playSound } from '@/Design/Sounds';
import { useCountdown } from './UseCountdown';
import type { SessionPhase } from './UseSessionPhase';

/**
 * How far apart the count-in's notes are, in semitones.
 *
 * Two steps from the first number to the last, which puts the last note a quarter above the
 * first: three notes a listener can put in order, and the last one saying "now". A fifth would
 * have been the start of a different tune rather than the end of this one.
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

/** How long the whole count-in takes, shade and numbers together. */
function countInMs(): number {
  return GameConfig.timing.startVeilMs + GameConfig.timing.startCountdownMs;
}

/**
 * Where this device is in the count-in, once the room has started writing.
 *
 * Counted on this device's own clock from the moment it heard about the phase, not on the
 * host's from the moment the host pressed Start. A count read off the host's clock is a count
 * shared between devices by the length of the message that announced it: a phone that was a
 * second late to the news joined the count a second in, and watched it begin at two. Nothing
 * about a count-in needs two phones looking at the same number for the same instant — what
 * needs that is the clock that ends the round, and that one still belongs to the host.
 *
 * Counted only by a device that has not seen this room do it already, which is what tells a
 * player arriving late apart from a player who refreshed mid-round: both land in the middle of
 * a writing phase, and only one of them was there for the start. It also keeps the count out of
 * every later round, where the players are already writing and a count-in would take the first
 * seconds of every answer from them.
 *
 * The note goes on the number changing rather than on a timer of its own, so a tab that was
 * throttled while it was hidden plays one note rather than a burst of the three it missed, and
 * it climbs with the count rather than wobbling.
 */
export function useStartCountdown(phase: SessionPhase, roomCode: string): StartCount {
  const countedRef = useRef(hasCountedIn(roomCode));
  const now = Date.now();
  const counting = phase.phase === 'Writing' && !countedRef.current;
  // Set while rendering rather than in an effect, because the count has to be running
  // on the very first render of the phase: an effect runs after the paint, and that
  // paint would be the room's writing screen with nothing counted over it.
  const startedRef = useRef<number | null>(null);
  if (counting && startedRef.current === null) {
    startedRef.current = now;
  }
  const { startVeilMs, startCountdownMs } = GameConfig.timing;
  const remainingMs = useCountdown(
    countInMs(),
    startedRef.current ?? now,
    0,
    counting,
  );
  // How far into the count-in this device is. The shade takes the first stretch of it
  // and the numbers the second, so this is the one measurement both are read from: the
  // shade is up while it still has time to run, and the first number appears exactly
  // when it has finished.
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
    // Marked once the whole count-in has run, not while there is no number on screen:
    // the shade is a moment with no number, and treating that as the end of the count
    // would stop the count before it began. Written down as well as remembered, so a
    // refresh or a new tab is the same device having been there.
    if (phase.phase === 'Writing' && remainingMs <= 0) {
      countedRef.current = true;
      markCountedIn(roomCode);
    }
  }, [phase.phase, remainingMs, roomCode]);

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
