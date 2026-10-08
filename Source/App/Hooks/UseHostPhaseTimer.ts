import { useEffect } from 'preact/hooks';
import {
  isPhaseName,
  isTimedPhase,
  phaseAfterCycling,
  phaseGraceMs,
} from '@/Game/PhaseFlow';
import type { Session } from '../Session';
import type { SessionPhase } from './UseSessionPhase';
import { useAnswersIn, useAnswerReveal, useRandomPick } from './UseRandomPick';

/** What ends a phase whose clock has run out: the round counter for Scores, and for the rest the
 * next move the table says goes there. A bank closed with nothing pressed is neither, which is
 * the one case where the clock says the bank is shut and not what the room does about it. */
function onElapsed(
  session: Session,
  phase: SessionPhase,
  answered: boolean,
  onScoresDone: () => void
): () => void {
  const name = phase.phase;
  if (!isPhaseName(name)) {
    return () => {};
  }
  if (name === 'Scores') {
    return onScoresDone;
  }
  return () => {
    if (name === 'Choosing' && !answered) {
      session.startRandomPick();
      return;
    }
    session.nextPhase(phaseAfterCycling(name));
  };
}

/** The host closes every timed phase, and its own clock is the reference. The delay is measured
 * * from the real phase start, not from when this effect ran, so a throttled or suspended host
 * fires the phase on time instead of running it again. */
export function useHostPhaseTimer(
  session: Session,
  isHost: boolean,
  phase: SessionPhase,
  onScoresDone: () => void,
  onThemeRevealed: () => void
): void {
  const { durationMs, phaseStartedAt, submittedCount, playerCount, answeredAt } = phase;
  const name = phase.phase;
  // Connecting is this browser's own moment before the host has spoken, so it is not a row in the
  // phase table and there is nothing here to time.
  const inGame = isPhaseName(name) ? name : null;
  const publicState = session.getPublicState();
  const choosing = publicState?.phase === 'Choosing' ? publicState : undefined;
  const answered = choosing?.theme !== undefined;

  useEffect(() => {
    // An answered bank has stopped its own clock, so this must not fire behind the reveal: the
    // round starts from what was chosen, not from the end of a duration nothing counts any more.
    if (!isHost || inGame === null || !isTimedPhase(inGame) || answeredAt !== undefined) {
      return;
    }
    const target = durationMs + phaseGraceMs(inGame);
    const remaining = Math.max(0, target - (Date.now() - phaseStartedAt));
    if (remaining === 0) {
      return;
    }
    const id = setTimeout(onElapsed(session, phase, answered, onScoresDone), remaining);
    return () => clearTimeout(id);
  }, [isHost, inGame, durationMs, phaseStartedAt, session, onScoresDone, answered, answeredAt]);

  useRandomPick(session, isHost, choosing?.picking);
  useAnswerReveal(isHost, answeredAt, onThemeRevealed);
  useAnswersIn(session, isHost, name, submittedCount, playerCount, publicState?.pace);
}
