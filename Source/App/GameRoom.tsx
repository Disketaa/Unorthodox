import { InfoScreen, LobbyDebugTools } from '@/Screens';
import { Strings } from '@/Content';
import { PlayerLook } from '@/Core';
import { DebugDock } from '@/Design/Overlays';
import { useGameSession } from './Hooks/UseGameSession';
import { useDebugToggle } from './Hooks/UseDebugToggle';
import type { GameSessionView } from './Hooks/UseGameSession';
import { SessionRole } from './Session';
import { LobbyView } from './Views/LobbyView';
import { WritingView } from './Views/WritingView';
import { ReviewView } from './Views/ReviewView';
import { ScoresView } from './Views/ScoresView';
import { FinalView } from './Views/FinalView';

export interface GameRoomProps {
  roomCode: string;
  role: SessionRole;
  name: string;
  /** The character this device joins with, the last one it wore or a fresh roll. */
  look: PlayerLook;
  /** Reports the character the host kept, so the next room in this tab starts from it. */
  onLook: (look: PlayerLook) => void;
}

/** The one sentence for each way a player can find themselves outside the room. */
const BlockedMessage = {
  NameTaken: Strings.status.nameTaken,
  Kicked: Strings.status.kicked,
} as const;

/** Pick the screen that matches the current phase. */
function PhaseScreen({ view }: { view: GameSessionView }) {
  // Both of these end the session as far as this player is concerned, so both send
  // them back to the entry screen rather than leaving them on a dead room.
  if (view.hostLeft) {
    return <InfoScreen message={Strings.status.hostLeft} onAcknowledge={view.exitRoom} />;
  }
  if (view.blocked !== undefined) {
    return <InfoScreen message={BlockedMessage[view.blocked]} onAcknowledge={view.exitRoom} />;
  }
  switch (view.phase) {
    case 'Lobby':
      return <LobbyView view={view} />;
    case 'Writing':
      return <WritingView view={view} />;
    case 'Reviewing':
      return <ReviewView view={view} />;
    case 'Scores':
      return <ScoresView view={view} />;
    case 'Final':
      return <FinalView view={view} />;
    default:
      // The same screen as the failures, because it is the same situation seen a
      // moment earlier. The mark and the button both change: the mark says it is
      // still waiting rather than that something is wrong, and the button gives
      // up on the wait rather than acknowledging a fact.
      return (
        <InfoScreen
          message={Strings.status.connecting}
          mark="Loading"
          action={Strings.common.cancel}
          onAcknowledge={view.exitRoom}
        />
      );
  }
}

/**
 * The room, and the host's dock under it.
 *
 * The dock is mounted here rather than by any screen, because it outlives them: the
 * "*" that opens it belongs to the host rather than to a phase, and the controls in
 * it are whatever the screen on top happens to offer — the lobby can add a player and
 * nothing else can, so every other phase shows the note with no controls beside it.
 */
export function GameRoom({ roomCode, role, name, look, onLook }: GameRoomProps) {
  const view = useGameSession(roomCode, role, name, look, onLook);
  const { debugEnabled } = useDebugToggle(view.isHost);
  return (
    <>
      <PhaseScreen view={view} />
      <DebugDock enabled={debugEnabled} label={Strings.lobby.debugOn}>
        {view.isHost && (
          <LobbyDebugTools publicState={view.publicState} onAddBot={view.addBot} />
        )}
      </DebugDock>
    </>
  );
}
