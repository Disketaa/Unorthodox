import { CountedRoom } from './Views/CountedRoom';
import { useGameSession } from './Hooks/UseGameSession';
import { useDebugToggle } from './Hooks/UseDebugToggle';
import { SessionRole } from './Session';
import { PlayerLook } from '@/Core';

export interface GameRoomProps {
  roomCode: string;
  role: SessionRole;
  name: string;
  /** The character this device joins with, the last one it wore or a fresh roll. */
  look: PlayerLook;
  /** Reports the character the host kept, so the next room in this tab starts from it. */
  onLook: (look: PlayerLook) => void;
}

/** The room, and the host's dock under it. The dock is mounted here rather than by any screen,
 * because it outlives them: the "" that opens it belongs to the host rather than to a phase. */
export function GameRoom({ roomCode, role, name, look, onLook }: GameRoomProps) {
  const view = useGameSession(roomCode, role, name, look, onLook);
  const { debugEnabled } = useDebugToggle(view.isHost);
  return <CountedRoom view={view} roomCode={roomCode} debugEnabled={debugEnabled} />;
}
