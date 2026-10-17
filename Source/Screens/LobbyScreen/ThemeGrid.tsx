import { ThemeId, ThemeIds, ThemeMode, CustomTheme, themeAccent } from '@/Core';
import { Button } from '@/Design/Components';
import { Stack } from '@/Design/Primitives';
import { GameConfig } from '@/Game';
import { Strings } from '@/Content';
import styles from './LobbyThemes.module.css';
import { CustomThemeCard } from './CustomThemeCard';

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

/** The rule over the themes, saying how many are on out of how many the room may name. The
 * random bank quotes the deal against the whole set, which moves when a host pastes one and so
 * says how likely a pasted theme is to come up. */
function themeLabel(mode: ThemeMode, count: number, total: number): string {
  return mode === 'Random'
    ? Strings.lobby.settings.themesRandom(ThemeLimit, total)
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

/** The grid of authored theme cards, each wearing its own tint, from the registry. The host's
 * pasted themes are not in it: they are already in rather than chosen out of a bank. What a
 * press means is worked out by the caller, so a card here is a tint, a state and a press. */
function ThemeGrid({
  themeMode,
  named,
  isHost,
  full,
  pick,
}: {
  themeMode: ThemeMode;
  named: readonly ThemeId[];
  isHost: boolean;
  full: boolean;
  pick: (theme: ThemeId) => void;
}) {
  if (themeMode !== 'Chosen') return null;
  return (
    <div class={styles.Grid}>
      {authoredThemes.map((theme) => (
        <Button
          key={theme}
          class={styles.Item}
          accent={themeAccent(theme)}
          pressed={named.includes(theme)}
          disabled={!isHost || (full && !named.includes(theme))}
          onClick={() => pick(theme)}
        >
          {theme}
        </Button>
      ))}
    </div>
  );
}

/** The custom themes from the host's paste, in their own grid under their own rule rather than
 * in the bank above. */
function CustomThemeGrid({
  customThemes,
  named,
  isHost,
  full,
  onPickCustom,
  onEdit,
}: {
  customThemes: readonly CustomTheme[];
  named: readonly ThemeId[];
  isHost: boolean;
  full: boolean;
  onPickCustom: (theme: CustomTheme) => void;
  onEdit: (theme: CustomTheme) => void;
}) {
  if (customThemes.length === 0) return null;
  return (
    <div class={styles.Grid}>
      {customThemes.map((theme) => (
        <CustomThemeCard
          key={theme.name}
          theme={theme}
          named={named}
          isHost={isHost}
          full={full}
          onPickCustom={onPickCustom}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

export { modes, authoredThemes, themeLabel, ModeButtons, ThemeGrid, CustomThemeGrid };
