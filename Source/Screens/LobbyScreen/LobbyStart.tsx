import { Stack, Text } from '@/Design/Primitives';
import { Banner, Button } from '@/Design/Components';
import { GameConfig } from '@/Game';
import { Strings } from '@/Content';

export interface LobbyStartProps {
  enoughPlayers: boolean;
  roomFull: boolean;
  isHost: boolean;
  onStart: () => void;
}

/**
 * The foot of the lobby: the room-full warning, and Start for the host or a
 * waiting note for everyone else.
 */
export function LobbyStart({
  enoughPlayers,
  roomFull,
  isHost,
  onStart,
}: LobbyStartProps) {
  if (!isHost) {
    return <Text variant="Caption">{Strings.lobby.waitingForHost}</Text>;
  }
  return (
    <Stack gap="Md" align="Stretch">
      {roomFull && <Banner variant="Error">{Strings.lobby.roomFull}</Banner>}
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
    </Stack>
  );
}
