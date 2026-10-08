import { Session } from '../Session';
import type { SessionPhase } from './UseSessionPhase';
import { useAnswersIn, useAnswerReveal, usePhaseClock, useRandomPick } from './UseRandomPick';

/** Everything the host ends a game on: its clocks, its own roll, the pause it may be holding,
 * and the moment every answer is in. Each is a hook of its own; this is the room deciding which
 * of them apply to the phase on screen. */
export function useHostPhaseTimer(
  session: Session,
  isHost: boolean,
  phase: SessionPhase,
  onScoresDone: () => void,
  onThemeRevealed: () => void
): void {
  const { submittedCount, playerCount, answeredAt } = phase;
  const publicState = session.getPublicState();
  const choosing = publicState?.phase === 'Choosing' ? publicState : undefined;
  const held = publicState?.paused === true;

  usePhaseClock(session, isHost, phase, onScoresDone);
  useRandomPick(session, isHost, held ? undefined : choosing?.picking);
  useAnswerReveal(isHost, held ? undefined : answeredAt, onThemeRevealed);
  useAnswersIn(
    session,
    isHost,
    phase.phase,
    submittedCount,
    playerCount,
    publicState?.pace,
    held
  );
}
