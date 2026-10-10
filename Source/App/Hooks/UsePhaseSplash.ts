import { useEffect, useRef, useState } from 'preact/hooks';
import { GameConfig, splashesOnArrival } from '@/Game';
import { PhaseSplashCovered, PhaseSplashMs } from '@/Design/Overlays';
import { playSound } from '@/Design/Sounds';
import type { SessionPhase } from './UseSessionPhase';

export interface PhaseSplashControl {
  /** True while the splash layer should be mounted. */
  splashing: boolean;
  /** True while the yellow covers the whole window, which is the only moment the screen under it
   * can be changed without anybody seeing the change. */
  covered: boolean;
  /** Play it now, whatever the phase. The dock's own control, and the only way to see the
   * movement without waiting out a round to reach a phase that splashes. */
  replay: () => void;
}

/** The splash, and when it plays. Started when this device notices the room arrive at a phase
 * that gets one, and held for `PhaseSplashMs` from that moment — timed the way the count-in is,
 * and for the same reason: a host-clock length is one a late message loses rather than plays. */
export function usePhaseSplash(phase: SessionPhase, counting: boolean): PhaseSplashControl {
  const [replay, setReplay] = useState({ phase: phase.phase, at: 0 });
  const now = Date.now();
  // Set while rendering, because the splash has to be running on the first frame of the phase it
  // belongs to: an effect runs after the paint, and that paint would be the new screen with
  // nothing played over it.
  const arrivedRef = useRef({ phase: phase.phase, at: 0 });
  if (arrivedRef.current.phase !== phase.phase || (!counting && arrivedRef.current.at === 0)) {
    arrivedRef.current = { phase: phase.phase, at: counting ? 0 : now };
  }
  // A replay belongs to the phase it was asked for, so asking for one and then moving on does not
  // leave a stale moment behind to swallow the next phase's own splash.
  const asked = replay.phase === phase.phase ? replay.at : 0;
  const startedAt = asked > 0 ? asked : arrivedRef.current.at;
  const elapsedMs = now - startedAt;
  const running = startedAt > 0 && splashesOnArrival(phase.phase) && elapsedMs < PhaseSplashMs;
  // The window in which the yellow is solid across the whole screen: the disc has finished
  // growing and the hole has not started opening. Outside it the room is partly visible, so a
  // screen changed there would be a screen caught halfway through changing.
  const covered =
    running &&
    elapsedMs >= PhaseSplashMs * PhaseSplashCovered.from &&
    elapsedMs < PhaseSplashMs * PhaseSplashCovered.to;
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
  return {
    splashing: running,
    covered,
    replay: () => setReplay({ phase: phase.phase, at: Date.now() }),
  };
}
