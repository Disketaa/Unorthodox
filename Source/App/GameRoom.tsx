import { Banner } from '@/Design/Components';
import { Stack } from '@/Design/Primitives';
import { InfoScreen } from '@/Screens';
import { Strings } from '@/Content';
import { PlayerLook } from '@/Core';
import { useGameSession } from './Hooks/UseGameSession';
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
export function GameRoom({ roomCode, role, name, look, onLook }: GameRoomProps) {
  const view = useGameSession(roomCode, role, name, look, onLook);
  const { exitRoom } = view;

  // Both of these end the session as far as this player is concerned, so both send
  // them back to the entry screen rather than leaving them on a dead room.
  if (view.hostLeft) {
    return <InfoScreen message={Strings.status.hostLeft} onAcknowledge={exitRoom} />;
  }
  if (view.blocked !== undefined) {
    return <InfoScreen message={BlockedMessage[view.blocked]} onAcknowledge={exitRoom} />;
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
      return (
        <Stack padding="Lg">
          <Banner variant="Info">{Strings.status.connecting}</Banner>
        </Stack>
      );
  }
}
