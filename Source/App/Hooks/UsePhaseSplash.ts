import { useEffect, useRef, useState } from 'preact/hooks';
import { GameConfig, splashesOnArrival } from '@/Game';
import { PhaseSplashMs } from '@/Design/Overlays';
import { playSound } from '@/Design/Sounds';
import type { SessionPhase } from './UseSessionPhase';

export interface PhaseSplashControl {
  /** True while the splash layer should be mounted. */
  splashing: boolean;
  /** Play it now, whatever the phase. The dock's own control, and the only way to see the
   * movement without waiting out a round to reach a phase that splashes. */
  replay: () => void;
}

/** The splash, and when it plays. Counted from the host's phase start so every screen in the
 * room plays it at the same moment, or from `countInEndedAt` where the room was counted into
 * this phase: that phase has been announced once already. */
export function usePhaseSplash(phase: SessionPhase, countInEndedAt = 0): PhaseSplashControl {
  const [replayAt, setReplayAt] = useState(0);
  const startedAt = replayAt > 0 ? replayAt : Math.max(phase.phaseStartedAt, countInEndedAt);
  const elapsedMs = Date.now() - startedAt;
  // Not before it starts as well as not after it ends. A count-in still running puts its own end
  // in the future, and a moment in the future is "less than the length" as surely as a moment in
  // the past is: without the lower bound the splash would play across the numbers it follows.
  const running =
    (replayAt > 0 || splashesOnArrival(phase.phase)) &&
    startedAt > 0 &&
    elapsedMs >= 0 &&
    elapsedMs < PhaseSplashMs;
  // Ticked on the room's own interval rather than left to a timeout, since a timeout would hold
  // the layer up on a tab that had been busy.
  const [, setNow] = useState(() => Date.now());
  // Played on the rise, when the whoosh and the mark arriving are the same event. Kept here
  // rather than in the overlay, since a design layer may not reach the sound bank and the sound
  // is a fact about the room rather than about how the mark is drawn.
  const soundingRef = useRef(false);
  useEffect(() => {
    if (!running) {
      soundingRef.current = false;
      return;
    }
    if (soundingRef.current) return;
    soundingRef.current = true;
    playSound('Whoosh');
  }, [running]);
  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), GameConfig.timing.uiTickMs);
    return () => clearInterval(id);
  }, [running]);
  return { splashing: running, replay: () => setReplayAt(Date.now()) };
}
