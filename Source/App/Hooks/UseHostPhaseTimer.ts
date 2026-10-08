import { Session } from '../Session';
import type { SessionPhase } from './UseSessionPhase';
import {
  useAnswersIn,
  useAnswerReveal,
  usePhaseClock,
  useQuestionReveal,
  useRandomPick,
} from './UseRandomPick';

/** Everything the host ends a game on: its clocks, its own roll, the pause it may be holding,
 * the question it reads out, and the moment every answer is in. Each is a hook of its own; this
 * is the room deciding which of them apply to the phase on screen. */
export function useHostPhaseTimer(
  session: Session,
  isHost: boolean,
  phase: SessionPhase,
  onScoresDone: () => void,
  onThemeRevealed: () => void,
  onQuestionRead: () => void
): void {
  const { submittedCount, playerCount, answeredAt } = phase;
  const publicState = session.getPublicState();
  const choosing = publicState?.phase === 'Choosing' ? publicState : undefined;
  const held = publicState?.paused === true;

  usePhaseClock(session, isHost, phase, onScoresDone);
  useRandomPick(session, isHost, held ? undefined : choosing?.picking);
  useAnswerReveal(isHost, held ? undefined : answeredAt, onThemeRevealed);
  useQuestionReveal(isHost, held ? undefined : choosing?.question, choosing?.questionAt, onQuestionRead);
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

/** The round's three hands, in one call: the theme held for a beat, then its question read out
 * word by word, then the round itself. Its own entry rather than three arguments at every call,
 * since the order they fire in is the whole of what they mean. */
export function useRoundClocks(
  session: Session,
  isHost: boolean,
  phase: SessionPhase,
  actions: { nextRound: () => void; revealQuestion: () => void; startRound: () => void }
): void {
  useHostPhaseTimer(session, isHost, phase, actions.nextRound, actions.revealQuestion, actions.startRound);
}
