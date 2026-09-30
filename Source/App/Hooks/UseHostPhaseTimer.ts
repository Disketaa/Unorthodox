import { useEffect } from 'preact/hooks';
import { GameConfig } from '@/Game';
import { Session } from '../Session';
import { SessionPhase } from './UseSessionPhase';

/**
 * The host closes every timed phase. Clients only count down locally, so a
 * single timer per phase in the host's browser is the single source of truth.
 */
export function useHostPhaseTimer(
  session: Session,
  isHost: boolean,
  phase: SessionPhase,
  onScoresDone: () => void,
): void {
  const { phase: name, durationMs, submittedCount, playerCount } = phase;

  useEffect(() => {
    if (!isHost) {
      return;
    }
    if (name === 'Writing') {
      const delay = durationMs + GameConfig.timing.graceMs;
      const id = setTimeout(() => session.closePhase(GameConfig.timing.reviewingDurationMs), delay);
      return () => clearTimeout(id);
    }
    if (name === 'Reviewing') {
      const id = setTimeout(() => session.closePhase(GameConfig.timing.scoresDurationMs), durationMs);
      return () => clearTimeout(id);
    }
    if (name === 'Scores') {
      const id = setTimeout(() => onScoresDone(), durationMs);
      return () => clearTimeout(id);
    }
  }, [isHost, name, durationMs, session, onScoresDone]);

  useEffect(() => {
    // Everyone answered: move on immediately instead of waiting out the clock.
    if (isHost && name === 'Writing' && playerCount > 0 && submittedCount >= playerCount) {
      session.closePhase(GameConfig.timing.reviewingDurationMs);
    }
  }, [isHost, name, submittedCount, playerCount, session]);
}
