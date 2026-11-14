import { LobbyRoom } from './LobbyRoom';
import { PlayerId, ThemeId, ThemeMode } from '@/Core';
import { PublicPlayer } from '@/Game';

export interface RoomCardProps {
  roomCode: string;
  players: readonly PublicPlayer[];
  ownPlayerId: PlayerId | null;
  isHost: boolean;
  onStart: () => void;
  onExit: () => void;
  onKick: (playerId: PlayerId) => void;
  onSetSpectator: (playerId: PlayerId, isSpectator: boolean) => void;
  themeMode: ThemeMode;
  themes: readonly ThemeId[];
}

export function RoomCard({
  roomCode,
  players,
  ownPlayerId,
  isHost,
  onStart,
  onExit,
  onKick,
  onSetSpectator,
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
      onSetSpectator={onSetSpectator}
      themeMode={themeMode}
      themes={themes}
    />
  );
}
