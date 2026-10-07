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

/** A beat on every second the block shows. Only the beat: the alarm at the end of a phase is not
 * this block's to play, since the frame that would draw zero is routinely the frame that draws
 * the next phase, and a block that sounds a phase ending is a design component with a phase. */
export function useCountdownBeat({
  remainingMs,
  totalMs,
  seconds,
  beatSemitones,
}: BeatProps): void {
  useEffect(() => {
    if (totalMs <= 0 || remainingMs <= 0) return;
    // Asked for by pitch only where the height carries the countdown; elsewhere left to the bank's
    // own scatter, since a run of identical notes is a printed loop.
    playSound('Tick', beatSemitones === 0 ? undefined : beatSemitones);
  }, [seconds]);
}
