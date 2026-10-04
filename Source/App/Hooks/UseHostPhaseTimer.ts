import { useEffect } from 'preact/hooks';
import { GameConfig } from '@/Game';
import { Session } from '../Session';
import { SessionPhase } from './UseSessionPhase';

/**
 * The host closes every timed phase, and its own clock is the reference.
 *
 * The delay is measured from the real phase start rather than from when this effect ran, so a
 * host whose tab was throttled or suspended fires the phase on time instead of running the
 * whole phase again.
 */
export function useHostPhaseTimer(
  session: Session,
  isHost: boolean,
  phase: SessionPhase,
  onScoresDone: () => void,
): void {
  const { phase: name, durationMs, phaseStartedAt, submittedCount, playerCount } = phase;

  useEffect(() => {
    if (!isHost) {
      return;
    }
    if (name !== 'Writing' && name !== 'Reviewing' && name !== 'Scores') {
      return;
    }
    const target = name === 'Writing' ? durationMs + GameConfig.timing.graceMs : durationMs;
    const alreadyElapsed = Date.now() - phaseStartedAt;
    const remaining = Math.max(0, target - alreadyElapsed);
    if (remaining === 0) {
      return;
    }
    const onElapsed = name === 'Scores' ? onScoresDone : () => closeWithNextDuration(name);
    const id = setTimeout(onElapsed, remaining);
    return () => clearTimeout(id);

    function closeWithNextDuration(phaseName: string): void {
      if (phaseName === 'Writing') {
        session.closePhase(GameConfig.timing.reviewingDurationMs);
      } else {
        session.closePhase(GameConfig.timing.scoresDurationMs);
      }
    }
  }, [isHost, name, durationMs, phaseStartedAt, session, onScoresDone]);

  useEffect(() => {
    // Everyone answered: move on immediately instead of waiting out the clock.
    if (isHost && name === 'Writing' && playerCount > 0 && submittedCount >= playerCount) {
      session.closePhase(GameConfig.timing.reviewingDurationMs);
    }
  }, [isHost, name, submittedCount, playerCount, session]);
}
