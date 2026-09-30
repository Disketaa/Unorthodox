import { Banner } from '@/Design/Components';
import { Stack } from '@/Design/Primitives';
import { HostLeftScreen } from '@/Screens';
import { Strings } from '@/Content';
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
}

/** Pick the screen that matches the current phase. */
export function GameRoom({ roomCode, role, name }: GameRoomProps) {
  const view = useGameSession(roomCode, role, name);

  if (view.hostLeft) {
    return <HostLeftScreen />;
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
