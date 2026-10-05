import { Separator, Stack } from '@/Design/Primitives';
import { Banner, Button } from '@/Design/Components';
import { GameConfig, Pace } from '@/Game';
import { Strings } from '@/Content';
import { LobbyCategory } from './LobbyCategory';

/** The paces, in the order they are offered: the one the room starts on first. Standard leads
 * because it is what a room is in until somebody says otherwise, and a row that led with the
 * exception would make the default look like the other one. */
const paces: readonly Pace[] = ['Standard', 'Fast'];

export interface LobbyPaceProps {
  /** The pace the room is set to, which only the host can change. */
  pace: Pace;
  /** Whether this device owns the setting, which is what makes the buttons live. A client still
   * sees the card and its numbers, and finds the buttons inert. */
  isHost: boolean;
  /** Asking for a pace. Only reached by the host, since a client's buttons are dead. */
  onPick: (pace: Pace) => void;
}

/** The three waits of a round, in the order a player meets them. Read from the pace rather than
 * written out, so a wait cannot be shown here at one length and run at another. */
function waits(pace: Pace) {
  const { writingMs, decidingMs, categoryMs } = GameConfig.paces[pace];
  return [
    { label: Strings.lobby.settings.writing, ms: writingMs },
    { label: Strings.lobby.settings.deciding, ms: decidingMs },
    { label: Strings.lobby.settings.category, ms: categoryMs },
  ];
}

/** The room's pace, and what that pace means in seconds. A pace named "fast" says nothing, and a
 * fast game nobody can see the terms of is a trap rather than a choice, so the values are the
 * point. Drawn `disabled` for clients, never hidden. */
export function LobbyPace({ pace, isHost, onPick }: LobbyPaceProps) {
  return (
    <LobbyCategory title={Strings.lobby.settings.title}>
      <Separator>{Strings.lobby.settings.params}</Separator>
      <Stack direction="Horizontal" gap="Sm" align="Stretch" fill="Even">
        {paces.map((option) => (
          <Button
            key={option}
            variant={option === pace ? 'Primary' : 'Muted'}
            disabled={!isHost}
            onClick={() => onPick(option)}
          >
            {Strings.lobby.settings.paces[option]}
          </Button>
        ))}
      </Stack>
      <Stack gap="Sm" align="Stretch">
        {waits(pace).map((wait) => (
          <Banner
            key={wait.label}
            variant="Muted"
            mark="Clock"
            value={Strings.lobby.settings.seconds(wait.ms / 1000)}
          >
            {wait.label}
          </Banner>
        ))}
      </Stack>
    </LobbyCategory>
  );
}
