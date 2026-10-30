import { PlayerLook, ThemeId } from '@/Core';
import { PublicState } from '@/Game';
import { Session, SessionRole } from '../Session';
import { SessionPhase } from './UseSessionPhase';
import { GameActions } from './UseGameActions';
import { RoundMarks, hasSubmittedIn } from './RoundMarks';
import { boardMarks } from './BoardMarks';
import { exitRoom, reportEditing } from './SessionUtils';
import { sessionActions } from './SessionActions';
import { GameSessionView } from './GameSessionView';

/** Join a room and expose one uniform view of the game for the screens. */
export function sessionView(
  session: Session,
  role: SessionRole,
  roomCode: string,
  publicState: PublicState | undefined,
  phase: SessionPhase,
  topic: string | null,
  marks: RoundMarks,
  actions: GameActions,
  ownLook: PlayerLook | undefined,
  bank: readonly ThemeId[],
  hostLeft: boolean,
  editing: boolean,
  markEditing: (editing: boolean) => void
): GameSessionView {
  return {
    ...phase,
    ...actions,
    role,
    isHost: role === 'Host',
    roomCode,
    playerId: session.getPlayerId(),
    publicState,
    paused: publicState?.paused === true,
    hasSubmitted: hasSubmittedIn(marks, topic),
    editing,
    ...boardMarks(publicState, marks, topic),
    setEditing: reportEditing(markEditing, actions.setEditingAnswer),
    hostLeft,
    blocked: session.getBlocked(),
    connectionHint: session.getConnectionHint(),
    roomLimit: session.getRoomLimit(),
    customThemes: session.getCustomThemes(),
    bank,
    ownLook,
    exitRoom,
    ...sessionActions(session),
  };
}
