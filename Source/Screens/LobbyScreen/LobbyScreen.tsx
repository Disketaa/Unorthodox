import { Stack, Text } from '@/Design/Primitives';
import { Button, PlayerChip, RoomCodeBadge, Banner } from '@/Design/Components';
import { PlayerId } from '@/Core';
import { Strings } from '@/Content';
import { GameConfig } from '@/Game';

export interface LobbyScreenProps {
  roomCode: string;
  players: readonly { id: PlayerId; name: string }[];
  isHost: boolean;
  onStart: () => void;
}

/** Waiting room: shows the room code and the roster, plus Start for the host. */
export function LobbyScreen({ roomCode, players, isHost, onStart }: LobbyScreenProps) {
  const enoughPlayers = players.length >= GameConfig.limits.minPlayers;
  const roomFull = players.length >= GameConfig.limits.maxPlayers;

  return (
    <Stack gap="Lg" padding="Lg" align="Stretch">
      <RoomCodeBadge code={roomCode} />
      <Text variant="Body">{Strings.lobby.shareHint}</Text>
      <Stack gap="Sm">
        {players.map((player, index) => (
          <PlayerChip key={player.id} name={player.name} isHost={index === 0} />
        ))}
      </Stack>
      {roomFull && <Banner variant="Error">{Strings.lobby.roomFull}</Banner>}
      {isHost ? (
        <>
          {!enoughPlayers && (
            <Banner variant="Info">
              {Strings.lobby.notEnoughPlayers(GameConfig.limits.minPlayers)}
            </Banner>
          )}
          <Button
            variant="Primary"
            size="Large"
            disabled={!enoughPlayers || roomFull}
            onClick={onStart}
          >
            {Strings.lobby.startButton}
          </Button>
        </>
      ) : (
        <Text variant="Caption">{Strings.lobby.waitingForHost}</Text>
      )}
    </Stack>
  );
}
