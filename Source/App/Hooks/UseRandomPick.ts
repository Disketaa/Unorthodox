import { useEffect } from 'preact/hooks';
import { GameConfig, isPhaseName, isTimedPhase, phaseGraceMs } from '@/Game';
import type { Pace, RandomPick } from '@/Game';
import { phaseAfterCycling, phaseDurationMs } from '@/Game/PhaseFlow';
import { Session } from '../Session';
import type { SessionPhase } from './UseSessionPhase';

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

/** The host closing every timed phase, off its own clock. Armed only while the room is running:
 * an answered bank and a held one have both stopped their own clock, and firing here would move
 * the room on behind a decision nobody has made. */
export function usePhaseClock(
  session: Session,
  isHost: boolean,
  phase: SessionPhase,
  onScoresDone: () => void
): void {
  const { durationMs, phaseStartedAt, answeredAt } = phase;
  const inGame = isPhaseName(phase.phase) ? phase.phase : null;
  const answered = session.getPublicState()?.phase === 'Choosing' && answeredAt !== undefined;
  const held = session.getPublicState()?.paused === true;

  useEffect(() => {
    if (
      !isHost ||
      inGame === null ||
      !isTimedPhase(inGame) ||
      answeredAt !== undefined ||
      held
    ) {
      return;
    }
    // From the real phase start rather than from when this ran, so a throttled or suspended host
    // fires on time instead of running the phase again.
    const target = durationMs + phaseGraceMs(inGame);
    const remaining = Math.max(0, target - (Date.now() - phaseStartedAt));
    if (remaining === 0) {
      return;
    }
    const id = setTimeout(onElapsed(session, phase, answered, onScoresDone), remaining);
    return () => clearTimeout(id);
  }, [isHost, inGame, durationMs, phaseStartedAt, session, onScoresDone, answered, held]);
}

/** The room's own roll, and the commit at the end of it. Its own hook because a bank nobody
 * answered is the one thing about Choosing the clock does not decide: the clock only says the
 * bank is shut, and what the room does about it is a message rather than a phase move. */
export function useRandomPick(
  session: Session,
  isHost: boolean,
  picking: RandomPick | undefined
): void {
  useEffect(() => {
    if (!isHost || picking === undefined) {
      return;
    }
    // Measured from the roll's own start rather than from when this ran, so a throttled host
    // commits on time instead of holding the bank open a second time.
    const startedAt = picking.startedAt - session.getClockOffsetMs();
    const remaining = Math.max(0, GameConfig.timing.pickingMs - (Date.now() - startedAt));
    const id = setTimeout(() => session.resolveRandomPick(), remaining);
    return () => clearTimeout(id);
  }, [isHost, picking, session]);
}

/** The theme answered, held on screen before the round starts. Its own hook because this is the
 * one moment where a phase waits without a clock running: the bank is open, the room is looking
 * at what it chose, and a second later the round is asking about it. */
export function useAnswerReveal(
  isHost: boolean,
  answeredAt: number | undefined,
  onRevealed: () => void
): void {
  useEffect(() => {
    if (!isHost || answeredAt === undefined) {
      return;
    }
    // From when it was answered rather than from when this ran, so the theme is held for the same
    // length on every screen rather than longer on whichever host happened to be slower.
    const remaining = Math.max(0, GameConfig.timing.answerRevealMs - (Date.now() - answeredAt));
    const id = setTimeout(onRevealed, remaining);
    return () => clearTimeout(id);
  }, [isHost, answeredAt, onRevealed]);
}

/** Everyone answered the round: move on rather than waiting out the rest of the clock. */
export function useAnswersIn(
  session: Session,
  isHost: boolean,
  name: string,
  submittedCount: number,
  playerCount: number,
  pace: Pace | undefined,
  held = false
): void {
  useEffect(() => {
    if (
      isHost &&
      !held &&
      name === 'Writing' &&
      playerCount > 0 &&
      submittedCount >= playerCount
    ) {
      session.endReviewing(phaseDurationMs(phaseAfterCycling('Writing'), pace ?? 'Standard'));
    }
  }, [isHost, name, submittedCount, playerCount, session, pace, held]);
}
