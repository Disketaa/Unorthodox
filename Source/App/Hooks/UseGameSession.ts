import { useEffect, useState } from 'preact/hooks';
import { PublicState } from '@/Game';
import { createSession } from '../SessionFactory';
import { Session, SessionRole } from '../Session';
import { useSessionPhase, SessionPhase } from './UseSessionPhase';
import { useGameActions } from './UseGameActions';
import { useHostPhaseTimer } from './UseHostPhaseTimer';

export interface GameSessionView extends SessionPhase {
  role: SessionRole;
  isHost: boolean;
  roomCode: string;
  publicState: PublicState | undefined;
  hasSubmitted: boolean;
  rejectedGroupIds: ReadonlySet<number>;
  hostLeft: boolean;
  startGame: () => void;
  submitAnswer: (text: string) => void;
  rejectGroup: (groupId: number) => void;
  nextRound: () => void;
  playAgain: () => void;
}

function addVote(voted: ReadonlySet<number>, groupId: number): ReadonlySet<number> {
  return new Set([...voted, groupId]);
}

/** Join a room and expose one uniform view of the game for the screens. */
export function useGameSession(
  roomCode: string,
  role: SessionRole,
  playerName: string,
): GameSessionView {
  const [session] = useState<Session>(() => createSession(role, roomCode, playerName));
  const [, setVersion] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [rejectedGroupIds, setRejectedGroupIds] = useState<ReadonlySet<number>>(() => new Set());
  const [hostLeft, setHostLeft] = useState(false);

  useEffect(() => {
    session.onUpdate(() => setVersion((version) => version + 1));
    session.onHostLeave(() => setHostLeft(true));
    return () => session.stop();
  }, [session]);

  const publicState = session.getPublicState();
  const phase = useSessionPhase(publicState);
  const actions = useGameActions(session, () => setHasSubmitted(true), (groupId) =>
    setRejectedGroupIds((voted) => addVote(voted, groupId)),
  );

  useHostPhaseTimer(session, role === 'Host', phase, actions.nextRound);

  return {
    ...phase,
    ...actions,
    role,
    isHost: role === 'Host',
    roomCode,
    publicState,
    hasSubmitted,
    rejectedGroupIds,
    hostLeft,
  };
}
