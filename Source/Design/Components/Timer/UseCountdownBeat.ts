import { useEffect } from 'preact/hooks';
import { playSound } from '../../Sounds';

export interface BeatProps {
  /** What the host says is left. */
  remainingMs: number;
  /** How long the phase was, or 0 where there is no phase to count. */
  totalMs: number;
  /** The figure the block is showing, which is what a beat is keyed on rather than the clock. */
  seconds: string;
  /** How far to pitch the beat up, where the phase has started closing in. */
  beatSemitones: number;
}

/** A beat on every second the block shows, and the alarm on the last one. The alarm is on the
 * beat showing one second, never one showing none: the host ends a phase by committing the
 * next, so the frame that would draw zero is routinely the frame that draws the next phase. */
export function useCountdownBeat({
  remainingMs,
  totalMs,
  seconds,
  beatSemitones,
}: BeatProps): void {
  useEffect(() => {
    // No length to count down, so nothing can end. A block rendered without a phase behind it is
    // the gallery's own.
    if (totalMs <= 0) return;
    // Anything below one is a frame arriving after the phase changed, from a client whose countdown
    // runs ahead of the host's. The alarm has already been given to the second it belongs to.
    if (Math.ceil(remainingMs / 1000) === 1) {
      playSound('Alarm');
      return;
    }
    if (remainingMs <= 0) return;
    // Asked for by pitch only where the height carries the countdown; elsewhere left to the bank's
    // own scatter, since a run of identical notes is a printed loop.
    playSound('Tick', beatSemitones === 0 ? undefined : beatSemitones);
  }, [seconds]);
}
