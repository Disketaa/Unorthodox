import { useEffect } from 'preact/hooks';
import {
  isPhaseName,
  isTimedPhase,
  phaseAfterCycling,
  phaseGraceMs,
} from '@/Game/PhaseFlow';
import { Session } from '../Session';
import { SessionPhase } from './UseSessionPhase';
import { useAnswersIn, useRandomPick } from './UseRandomPick';

/** The host closes every timed phase, and its own clock is the reference. The delay is measured
 * from the real phase start, not from when this effect ran, so a throttled or suspended host
 * fires the phase on time instead of running it again. */
export function useHostPhaseTimer(
  session: Session,
  isHost: boolean,
  phase: SessionPhase,
  onScoresDone: () => void
): void {
  const { durationMs, phaseStartedAt, submittedCount, playerCount } = phase;
  const name = phase.phase;
  // Connecting is this browser's own moment before the host has spoken, so it is not a row in the
  // phase table and there is nothing here to time.
  const inGame = isPhaseName(name) ? name : null;
  const publicState = session.getPublicState();
  const choosing = publicState?.phase === 'Choosing' ? publicState : undefined;

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
    const onElapsed =
      inGame === 'Scores'
        ? onScoresDone
        : () => {
            // A bank that closed with nothing pressed on it is not a round without a theme, it is
            // a round the room answers itself. The sweep takes its own time and moves on after.
            if (inGame === 'Choosing' && choosing?.theme === undefined) {
              session.startRandomPick();
              return;
            }
            session.nextPhase(phaseAfterCycling(inGame));
          };
    const id = setTimeout(onElapsed, remaining);
    return () => clearTimeout(id);
  }, [isHost, inGame, durationMs, phaseStartedAt, session, onScoresDone, choosing?.theme]);

  useRandomPick(session, isHost, choosing?.picking);
  useAnswersIn(session, isHost, name, submittedCount, playerCount, publicState?.pace);
}
