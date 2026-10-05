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

/** The room's pace, and what that pace means in seconds. The two buttons are the only way the
 * values change, and the values are the reason the buttons exist: a pace named "fast" says
 * nothing, and a fast game that nobody can see the terms of is a trap for the room rather than
 * a choice. A client sees the same card with the same numbers, and the buttons are drawn dead —
 * `disabled`, which is what puts the not-allowed cursor and the half opacity on them rather
 * than a new variant of the button. The card is not hidden from a client: a player who cannot
 * see what pace the room is playing cannot agree to play it, and the numbers are the whole
 * point of the card. So nothing is local here any more. The pace is read from the room and the
 * press goes to whoever owns it, which is what the state does and what this used to work
 * around. */
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
