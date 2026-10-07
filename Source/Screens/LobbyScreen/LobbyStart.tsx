import { Stack } from '@/Design/Primitives';
import { Banner, Button } from '@/Design/Components';
import { Strings } from '@/Content';

export interface LobbyStartProps {
  enoughPlayers: boolean;
  isHost: boolean;
  onStart: () => void;
}

/** Start button for the host, muted when the room is not ready. */
export function LobbyStart({ enoughPlayers, isHost, onStart }: LobbyStartProps) {
  if (!isHost) {
    return <Banner variant="Info">{Strings.lobby.waitingForHost}</Banner>;
  }
  return (
    <Stack gap="Md" align="Stretch">
      <Button
        variant="Primary"
        size="Large"
        pulse={enoughPlayers}
        disabled={!enoughPlayers}
        onClick={onStart}
      >
        {Strings.lobby.startButton}
      </Button>
    </Stack>
  );
}
