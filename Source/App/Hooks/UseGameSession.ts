import { useEffect, useState } from 'preact/hooks';
import { PublicState } from '@/Game';
import { createSession } from '../SessionFactory';
import { Session, SessionRole } from '../Session';
import { useSessionPhase, SessionPhase } from './UseSessionPhase';
import { useGameActions } from './UseGameActions';
import { useHostPhaseTimer } from './UseHostPhaseTimer';
import {
  emptyMarks,
  hasSubmittedIn,
  markRejected,
  markSubmitted,
  rejectedIn,
  type RoundMarks,
} from './RoundMarks';

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

/** Read the topic of the phase in view, which identifies the round. */
function readTopic(publicState: PublicState | undefined): string | null {
  return publicState !== undefined && 'topic' in publicState ? publicState.topic : null;
}

/** Join a room and expose one uniform view of the game for the screens. */
export function useGameSession(
  roomCode: string,
  role: SessionRole,
  playerName: string,
): GameSessionView {
  const [session] = useState<Session>(() => createSession(role, roomCode, playerName));
  const [, setVersion] = useState(0);
  const [marks, setMarks] = useState<RoundMarks>(emptyMarks);
  const [hostLeft, setHostLeft] = useState(false);

  useEffect(() => {
    session.onUpdate(() => setVersion((version) => version + 1));
    session.onHostLeave(() => setHostLeft(true));
    return () => session.stop();
  }, [session]);

  const publicState = session.getPublicState();
  const phase = useSessionPhase(publicState);
  const topic = readTopic(publicState);
  const actions = useGameActions(
    session,
    () => setMarks((current) => markSubmitted(current, topic)),
    (groupId) => setMarks((current) => markRejected(current, topic, groupId)),
  );

  useHostPhaseTimer(session, role === 'Host', phase, actions.nextRound);

  return {
    ...phase,
    ...actions,
    role,
    isHost: role === 'Host',
    roomCode,
    publicState,
    // Both marks only count while the phase still shows the round they were made in.
    hasSubmitted: hasSubmittedIn(marks, topic),
    rejectedGroupIds: rejectedIn(marks, topic),
    hostLeft,
  };
}