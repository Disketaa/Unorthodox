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
  /*
   * The Start button appears only once it would work.
   *
   * Not a disabled button: a greyed-out button still has to be read past and
   * worked out, and the banner above already says plainly why it is not there.
   * Half-strength gold on white reads as broken rather than as not yet.
   */
  const canStart = enoughPlayers && !roomFull;
  return (
    <Stack gap="Md" align="Stretch">
      {roomFull && <Banner variant="Error">{Strings.lobby.roomFull}</Banner>}
      {!enoughPlayers && (
        <Banner variant="Info">
          {Strings.lobby.notEnoughPlayers(GameConfig.limits.minPlayers)}
        </Banner>
      )}
      {canStart && (
        <Button variant="Primary" size="Large" onClick={onStart}>
          {Strings.lobby.startButton}
        </Button>
      )}
    </Stack>
  );
}
