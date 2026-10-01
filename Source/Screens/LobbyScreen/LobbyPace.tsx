import { useState } from 'preact/hooks';
import { Separator, Stack } from '@/Design/Primitives';
import { Banner, Button } from '@/Design/Components';
import { GameConfig, Pace } from '@/Game';
import { Strings } from '@/Content';
import { LobbyCategory } from './LobbyCategory';

/**
 * The paces, in the order they are offered: the one the room starts on first.
 *
 * Standard leads because it is what a room is in until somebody says otherwise, and
 * a row that led with the exception would make the default look like the other one.
 */
const paces: readonly Pace[] = ['Standard', 'Fast'];

export interface LobbyPaceProps {
  /** The pace the room is set to, which only the host can change. */
  pace: Pace;
  /**
   * Asking for a pace. The host's click changes the room and the answer comes back
   * through `pace`; a client's click changes nothing but its own preview.
   */
  onPick: (pace: Pace) => void;
}

/**
 * The three waits of a round, in the order a player meets them.
 *
 * Read from the pace rather than written out, so a wait cannot be shown here at one
 * length and run at another.
 */
function waits(pace: Pace) {
  const { writingMs, decidingMs, categoryMs } = GameConfig.paces[pace];
  return [
    { label: Strings.lobby.settings.writing, ms: writingMs },
    { label: Strings.lobby.settings.deciding, ms: decidingMs },
    { label: Strings.lobby.settings.category, ms: categoryMs },
  ];
}

/**
 * The room's pace, and what that pace means in seconds.
 *
 * The two buttons are the only way the values change, and the values are the reason
 * the buttons exist: a pace named "fast" says nothing, and a fast game that nobody
 * can see the terms of is a trap for the room rather than a choice.
 *
 * A client may press them and is shown its own pace, because a setting nobody can look
 * at is a setting nobody can agree to. What it is shown next is the room's: the preview
 * is dropped the moment the room's pace changes, so the host's answer is what is read.
 *
 * The reset is done during render rather than in an effect, because the alternative is
 * a frame in which the card shows the host's new numbers and the old button is still
 * filled — a flash of "Обычно" that nobody chose. Setting state while rendering is the
 * documented way to do this: React runs the component again immediately, before
 * painting, and the second pass has both values already in step.
 */
export function LobbyPace({ pace, onPick }: LobbyPaceProps) {
  const [preview, setPreview] = useState<Pace | undefined>(undefined);
  const [seen, setSeen] = useState(pace);
  if (seen !== pace) {
    setSeen(pace);
    setPreview(undefined);
  }
  const shown = preview ?? pace;
  return (
    <LobbyCategory title={Strings.lobby.settings.title}>
      <Separator>{Strings.lobby.settings.params}</Separator>
      <Stack direction="Horizontal" gap="Sm" align="Stretch" fill="Even">
        {paces.map((option) => (
          <Button
            key={option}
            variant={option === shown ? 'Primary' : 'Muted'}
            onClick={() => {
              onPick(option);
              setPreview(option);
            }}
          >
            {Strings.lobby.settings.paces[option]}
          </Button>
        ))}
      </Stack>
      <Stack gap="Sm" align="Stretch">
        {waits(shown).map((wait) => (
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
