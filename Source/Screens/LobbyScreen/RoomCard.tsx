import { LobbyRoom } from './LobbyRoom';
import { PlayerId, ThemeRef, ThemeMode } from '@/Core';
import { PublicPlayer } from '@/Game';

export interface RoomCardProps {
  roomCode: string;
  players: readonly PublicPlayer[];
  ownPlayerId: PlayerId | null;
  isHost: boolean;
  onStart: () => void;
  onExit: () => void;
  onKick: (playerId: PlayerId) => void;
  themeMode: ThemeMode;
  themes: readonly ThemeRef[];
}

export function RoomCard({
  roomCode,
  players,
  ownPlayerId,
  isHost,
  onStart,
  onExit,
  onKick,
  themeMode,
  themes,
}: RoomCardProps) {
  return (
    <LobbyRoom
      roomCode={roomCode}
      players={players}
      ownPlayerId={ownPlayerId}
      isHost={isHost}
      onStart={onStart}
      onExit={onExit}
      onKick={onKick}
      themeMode={themeMode}
      themes={themes}
    />
  );
}
