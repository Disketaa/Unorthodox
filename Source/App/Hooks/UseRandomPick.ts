import { useEffect } from 'preact/hooks';
import { GameConfig } from '@/Game';
import type { Pace, RandomPick } from '@/Game';
import { phaseAfterCycling, phaseDurationMs } from '@/Game/PhaseFlow';
import { Session } from '../Session';

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

/** Everyone answered the round: move on rather than waiting out the rest of the clock. */
export function useAnswersIn(
  session: Session,
  isHost: boolean,
  name: string,
  submittedCount: number,
  playerCount: number,
  pace: Pace | undefined
): void {
  useEffect(() => {
    if (isHost && name === 'Writing' && playerCount > 0 && submittedCount >= playerCount) {
      session.endReviewing(phaseDurationMs(phaseAfterCycling('Writing'), pace ?? 'Standard'));
    }
  }, [isHost, name, submittedCount, playerCount, session, pace]);
}
