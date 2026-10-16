import { Separator, Stack } from '@/Design/Primitives';
import {
  Banner,
  Button,
  FullscreenButton,
  MusicButton,
  VolumeButton,
} from '@/Design/Components';
import { GameConfig, Pace, reviewingDurationMs } from '@/Game';
import { ThemeId, ThemeMode, CustomTheme } from '@/Core';
import { Strings } from '@/Content';
import { LobbyCategory } from './LobbyCategory';
import { LobbyThemes } from './LobbyThemes';

/** The paces, in the order they are offered: the one the room starts on first. Standard leads
 * because it is what a room is in until somebody says otherwise, and a row that led with the
 * exception would make the default look like the other one. */
const paces: readonly Pace[] = ['Standard', 'Fast'];

export interface LobbyPaceProps {
  /** The pace the room is set to, which only the host can change. */
  pace: Pace;
  /** Which way the room is given its themes, and the ones it has named. */
  themeMode: ThemeMode;
  themes: readonly ThemeId[];
  /** How many are in the room. The voting round is timed from the roster rather than from a
   * fixed figure, so a room of four is told what four players get and not what a full house
   * gets. */
  players: number;
  /** Whether this device owns the setting, which is what makes the buttons live. A client still
   * sees the card and its numbers, and finds the buttons inert. */
  isHost: boolean;
  /** Asking for a pace. Only reached by the host, since a client's buttons are dead. */
  onPick: (pace: Pace) => void;
  /** Asking for a different way of taking themes. Only reached by the host, since a client's
   * buttons are dead and the room's pool is told to them in the public state. */
  onPickThemes: (mode: ThemeMode, themes: readonly ThemeId[]) => void;
  /** Opening the paste window without saving. */
  onLoadCustomThemes: () => void;
  onEditCustomThemes: (theme: CustomTheme, clash?: string) => void;
  /** The custom themes this room knows, so the grid can show them. */
  customThemes: readonly CustomTheme[];
}

/** The three waits of a round, in the order a player meets them. Read from the pace rather than
 * written out, so a wait cannot be shown at one length and run at another. */
function waits(pace: Pace, players: number) {
  const { writingMs, categoryMs } = GameConfig.paces[pace];
  const decidingMs = reviewingDurationMs(players, pace);
  return [
    { label: Strings.lobby.settings.writing, ms: writingMs },
    { label: Strings.lobby.settings.deciding, ms: decidingMs },
    { label: Strings.lobby.settings.category, ms: categoryMs },
  ];
}

/** How many questions each theme asks, by pace. Fast gets fewer, Standard gets more. */
function questionsPerTheme(pace: Pace): number {
  return pace === 'Fast' ? 5 : 10;
}

/** The three waits a pace decides, one row each, under the pace buttons that decide them. */
function WaitRows({ pace, players }: Pick<LobbyPaceProps, 'pace' | 'players'>) {
  return (
    <Stack gap="Sm" align="Stretch">
      {waits(pace, players).map((wait) => (
        <Banner
          key={wait.label}
          variant="Muted"
          mark="Clock"
          fill
          value={Strings.lobby.settings.seconds(wait.ms / 1000)}
        >
          {wait.label}
        </Banner>
      ))}
      <Banner variant="Muted" mark="Question" fill value={String(questionsPerTheme(pace))}>
        {Strings.lobby.settings.roundsPerTheme}
      </Banner>
    </Stack>
  );
}

/** The room's pace, what it means in seconds, and the themes the bank is dealt from. */
export function LobbyPace({
  pace,
  themeMode,
  themes,
  players,
  isHost,
  onPick,
  onPickThemes,
  onLoadCustomThemes,
  onEditCustomThemes,
  customThemes,
}: LobbyPaceProps) {
  return (
    <LobbyCategory
      title={Strings.lobby.settings.title}
      action={<LobbyActions labels={Strings.lobby.settings} />}
    >
      <Separator>{Strings.lobby.settings.params}</Separator>
      <PaceChoices pace={pace} isHost={isHost} onPick={onPick} />
      <WaitRows pace={pace} players={players} />
      <LobbyThemes
        themeMode={themeMode}
        themes={themes}
        isHost={isHost}
        onPick={onPickThemes}
        onLoadCustomThemes={onLoadCustomThemes}
        onEditCustomThemes={onEditCustomThemes}
        customThemes={customThemes}
      />
    </LobbyCategory>
  );
}

function LobbyActions({
  labels,
}: {
  labels: {
    fullscreen: string;
    minimize: string;
    mute: string;
    unmute: string;
    musicOff: string;
    musicOn: string;
  };
}) {
  return (
    <Stack direction="Horizontal" gap="Sm">
      <FullscreenButton labels={labels} />
      <VolumeButton labels={labels} />
      <MusicButton labels={labels} />
    </Stack>
  );
}

/** The two paces, side by side and each taking half the row. Its own component rather than a
 * block inside the room's, since it is the only interactive row here and the rest is a readout. */
function PaceChoices({
  pace,
  isHost,
  onPick,
}: Pick<LobbyPaceProps, 'pace' | 'isHost' | 'onPick'>) {
  return (
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
  );
}
