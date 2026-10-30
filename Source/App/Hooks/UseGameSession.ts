import { useState } from 'preact/hooks';
import { PlayerLook } from '@/Core';
import { createSession } from '../SessionFactory';
import { Session, SessionRole } from '../Session';
import { useSessionUpdates } from './UseSessionUpdates';
import { useLocalFlags } from './UseLocalFlags';
import { usePerfPhase } from './UsePerfPhase';
import { useRoundClocks } from './UseHostPhaseTimer';
import { usePhaseAndTopic } from './UsePhaseAndTopic';
import { exposePerfJump } from './ExposePerfJump';
import { useRoundMarks } from './UseRoundMarks';
import { useOwnLookAndBank } from './UseOwnLookAndBank';
import { sessionView } from './SessionView';
import { GameSessionView } from './GameSessionView';

export type { GameSessionView } from './GameSessionView';

/** Join a room and expose one uniform view of the game for the screens. */
export function useGameSession(
  roomCode: string,
  role: SessionRole,
  playerName: string,
  look: PlayerLook,
  onLook: (look: PlayerLook) => void
): GameSessionView {
  const [session] = useState<Session>(() => createSession(role, roomCode, playerName, look));
  const { hostLeft, editing, bump, setHostLeft, markEditing } = useLocalFlags();
  useSessionUpdates(session, bump, setHostLeft);
  const publicState = session.getPublicState();
  const { phase, topic } = usePhaseAndTopic(session, publicState);
  usePerfPhase(phase.phase);
  exposePerfJump(session);
  const { marks, actions } = useRoundMarks(session, publicState, roomCode, topic);
  useRoundClocks(session, role === 'Host', phase, actions);
  const { ownLook, bank } = useOwnLookAndBank(session, phase, onLook, roomCode, publicState);
  return sessionView(session, role, roomCode, publicState, phase, topic, marks, actions, ownLook, bank, hostLeft, editing, markEditing);
}
