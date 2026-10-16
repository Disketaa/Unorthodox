import { ThemeId, ThemeIds, ThemeMode, CustomTheme, Accents, themeAccent } from '@/Core';
import { Button } from '@/Design/Components';
import { Stack } from '@/Design/Primitives';
import { GameConfig } from '@/Game';
import { Strings } from '@/Content';
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
const authoredThemes: readonly ThemeId[] = [...ThemeIds];

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

/** The grid of theme cards, each wearing its own tint. Authored themes come from the registry,
 * custom themes come from the host's paste. Both wear their own tint. */
function ThemeGrid({
  themeMode,
  named,
  customThemes,
  isHost,
  full,
  onPick,
}: {
  themeMode: ThemeMode;
  named: readonly ThemeId[];
  customThemes: readonly CustomTheme[];
  isHost: boolean;
  full: boolean;
  onPick: (mode: ThemeMode, themes: readonly ThemeId[]) => void;
}) {
  if (themeMode !== 'Chosen') return null;
  return (
    <div class={styles.Grid}>
      {authoredGrid(named, isHost, full, onPick)}
      {customGrid(customThemes, isHost, full)}
    </div>
  );
}

/** The authored themes from the registry, each wearing its own tint. */
function authoredGrid(
  named: readonly ThemeId[],
  isHost: boolean,
  full: boolean,
  onPick: (mode: ThemeMode, themes: readonly ThemeId[]) => void,
) {
  return authoredThemes.map((theme) => (
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
  ));
}

/** The custom themes from the host's paste, each wearing its own tint. Always pressed. */
function customGrid(
  customThemes: readonly CustomTheme[],
  isHost: boolean,
  full: boolean,
) {
  return customThemes.map((theme) => (
    <Button
      key={theme.id}
      class={styles.Item}
      accent={Accents[theme.color]}
      pressed
      disabled={!isHost || full}
      onClick={() => {}}
    >
      {theme.name}
    </Button>
  ));
}

export { modes, authoredThemes, toggle, themeLabel, ModeButtons, ThemeGrid };
