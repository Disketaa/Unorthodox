import { useEffect } from 'preact/hooks';
import {
  isPhaseName,
  isTimedPhase,
  phaseAfterCycling,
  phaseDurationMs,
  phaseGraceMs,
} from '@/Game/PhaseFlow';
import { Session } from '../Session';
import { SessionPhase } from './UseSessionPhase';

/** The host closes every timed phase, and its own clock is the reference. The delay is measured
 * from the real phase start, not from when this effect ran, so a throttled or suspended host
 * fires the phase on time instead of running it again. */
export function useHostPhaseTimer(
  session: Session,
  isHost: boolean,
  phase: SessionPhase,
  onScoresDone: () => void,
): void {
  const { durationMs, phaseStartedAt, submittedCount, playerCount } = phase;
  const name = phase.phase;
  // Connecting is this browser's own moment before the host has spoken, so it is not a row in the
  // phase table and there is nothing here to time.
  const inGame = isPhaseName(name) ? name : null;

  useEffect(() => {
    if (!isHost || inGame === null || !isTimedPhase(inGame)) {
      return;
    }
    const target = durationMs + phaseGraceMs(inGame);
    const remaining = Math.max(0, target - (Date.now() - phaseStartedAt));
    if (remaining === 0) {
      return;
    }
    // Scores ends through the round counter rather than the table, since the last round ends
    // the game and the table has no row for that.
    const onElapsed = inGame === 'Scores' ? onScoresDone : () => {
      session.nextPhase(phaseAfterCycling(inGame));
    };
    const id = setTimeout(onElapsed, remaining);
    return () => clearTimeout(id);
  }, [isHost, inGame, durationMs, phaseStartedAt, session, onScoresDone]);

  useEffect(() => {
    // Everyone answered: move on instead of waiting out the clock. The phase it moves to and how
    // long that one runs are both read from the table rather than named here.
    if (isHost && name === 'Writing' && playerCount > 0 && submittedCount >= playerCount) {
      const pace = session.getPublicState()?.pace ?? 'Standard';
      session.endReviewing(phaseDurationMs(phaseAfterCycling('Writing'), pace));
    }
  }, [isHost, name, submittedCount, playerCount, session]);
}
