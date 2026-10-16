import { ThemeId, ThemeIds, ThemeMode, themeAccent, CustomTheme } from '@/Core';
import { Button } from '@/Design/Components';
import { Separator, Stack } from '@/Design/Primitives';
import { GameConfig } from '@/Game';
import { Strings } from '@/Content';
import { CustomThemesPopup } from './CustomThemesPopup';
import styles from './LobbyThemes.module.css';

/** How many themes a room may name at once, which is the size of the bank the lobby deals. A
 * pool larger than the deal is a pool the room is only ever choosing between, so the figure is
 * read from the deal rather than written here: the two cannot drift apart. */
export const ThemeLimit = GameConfig.themes.cardsPerLobby;

/** The two ways a room can be given its themes, in the order they are offered: the way a room
 * starts on first. The random one leads because it is what a room is in until somebody says
 * otherwise, and a row leading with the exception makes the other one look like the default. */
const modes: readonly ThemeMode[] = ['Random', 'Chosen'];

/** The themes the grid offers, in the registry's order, which is the one order every tab reaches
 * the same way. Every theme there is, since a bank drawn from all of them is the random mode
 * above rather than a ninth card. */
const themes: readonly ThemeId[] = [...ThemeIds];

export interface LobbyThemesProps {
  /** Which way the room is given its themes. */
  themeMode: ThemeMode;
  /** The themes it has named, which are kept whatever the mode is: a host who has looked at the
   * random bank and come back has not forgotten what they chose. */
  themes: readonly ThemeId[];
  /** Whether this device owns the setting. A client sees the same row and cannot press it. */
  isHost: boolean;
  /** Asking for a different pool. Only reached by the host, since a client's buttons are dead. */
  onPick: (mode: ThemeMode, themes: readonly ThemeId[]) => void;
  /** The custom themes this room knows, so the popup can show them. */
  customThemes: readonly CustomTheme[];
  /** The host pasting in custom themes, which every client is then told. */
  onCustomThemes: (themes: readonly CustomTheme[]) => void;
  /** Whether the paste window is open. */
  customThemesOpen: boolean;
  /** Opening the paste window without saving. */
  onCustomThemesOpen: () => void;
  /** Closing the paste window without saving. */
  onCustomThemesClose: () => void;
}

/** What one press on a theme means: it goes on beside the others, or comes back off. Never a
 * switch of mode — naming a theme is a thing the host does on the way to `Chosen`, and a press
 * that turned the random bank off behind their back would be a mode they did not choose. */
function toggle(named: readonly ThemeId[], pressed: ThemeId): readonly ThemeId[] {
  return named.includes(pressed)
    ? named.filter((theme) => theme !== pressed)
    : [...named, pressed];
}

/** The rule over the themes, saying how many are on out of how many the room may name. The
 * random pool has no count worth quoting — it is every theme — so it is named plainly, and the
 * two buttons under it are what say which way the room is being given them. */
function themeLabel(mode: ThemeMode, count: number): string {
  return mode === 'Random'
    ? Strings.lobby.settings.themes
    : Strings.lobby.settings.themesChosen(count, ThemeLimit);
}

/** The two buttons under the themes rule: Random or Chosen. */
function ModeButtons({
  themeMode,
  isHost,
  onPick,
  named,
}: {
  themeMode: ThemeMode;
  isHost: boolean;
  onPick: (mode: ThemeMode, themes: readonly ThemeId[]) => void;
  named: readonly ThemeId[];
}) {
  return (
    <Stack direction="Horizontal" gap="Sm" align="Stretch" fill="Even">
      {modes.map((mode) => (
        <Button
          key={mode}
          variant={mode === themeMode ? 'Primary' : 'Muted'}
          pressed={mode === themeMode}
          disabled={!isHost}
          onClick={() => onPick(mode, named)}
        >
          {Strings.lobby.settings.themeModes[mode]}
        </Button>
      ))}
    </Stack>
  );
}

/** The grid of theme cards, each wearing its own tint. */
function ThemeGrid({
  themeMode,
  named,
  isHost,
  full,
  onPick,
}: {
  themeMode: ThemeMode;
  named: readonly ThemeId[];
  isHost: boolean;
  full: boolean;
  onPick: (mode: ThemeMode, themes: readonly ThemeId[]) => void;
}) {
  if (themeMode !== 'Chosen') return null;
  return (
    <div class={styles.Grid}>
      {themes.map((theme) => (
        <Button
          key={theme}
          class={styles.Item}
          accent={themeAccent(theme)}
          pressed={named.includes(theme)}
          disabled={!isHost || (full && !named.includes(theme))}
          onClick={() => onPick('Chosen', toggle(named, theme))}
        >
          {theme}
        </Button>
      ))}
    </div>
  );
}

/** The themes a room is played from: which way it is given them, and then — only when it has
 * chosen them — every theme there is, each wearing its own tint. Under the random bank the grid
 * is not drawn at all: none of the eight is in play, and dead buttons are pressed anyway. */
export function LobbyThemes({
  themeMode,
  themes: named,
  isHost,
  onPick,
  onCustomThemes,
  customThemesOpen,
  onCustomThemesOpen,
  onCustomThemesClose,
}: LobbyThemesProps) {
  // A full pool turns the rest of the grid dead rather than dropping one of the six to make room
  // for a seventh: the host asked for the six they named, and swapping one out for one they did
  // not is a change they never pressed for.
  const full = themeMode === 'Chosen' && named.length >= ThemeLimit;
  return (
    <>
      <Separator>{themeLabel(themeMode, named.length)}</Separator>
      <ModeButtons themeMode={themeMode} isHost={isHost} onPick={onPick} named={named} />
      {themeMode === 'Chosen' && (
        <>
          <ThemeGrid themeMode={themeMode} named={named} isHost={isHost} full={full} onPick={onPick} />
          <Separator>{Strings.lobby.settings.customThemes}</Separator>
          <Stack direction="Horizontal" gap="Sm" align="Stretch" fill="Even">
            <Button
              variant="Muted"
              disabled={!isHost}
              onClick={() => onCustomThemesOpen()}
            >
              {Strings.lobby.settings.loadCustomThemes}
            </Button>
          </Stack>
        </>
      )}
      <CustomThemesPopup
        open={customThemesOpen}
        onClose={onCustomThemesClose}
        onSave={onCustomThemes}
      />
    </>
  );
}
