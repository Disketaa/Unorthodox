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
 * that turned the random bank off behind their back would be a mode they did not choose.
 * Written over refs rather than ids alone so a custom theme, which has a number and no id,
 * toggles by the same press as an authored one. */
function toggle(named: readonly ThemeId[], pressed: ThemeId): readonly ThemeId[] {
  return named.includes(pressed)
    ? named.filter((theme) => theme !== pressed)
    : [...named, pressed];
}

/** The rule over the themes, saying how many are on out of how many the room may name. The
 * random bank quotes the deal against the whole set rather than saying nothing: the set is
 * every theme the browser knows, authored and pasted together, so the figure moves when a host
 * pastes one and is the number that says how likely a pasted theme is to come up. */
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
 * pasted themes are not in it: they have their own grid under their own rule, because they are
 * not chosen out of a bank — they are already in. */
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
  return <div class={styles.Grid}>{authoredGrid(named, isHost, full, onPick)}</div>;
}

/** The authored themes from the registry, each wearing its own tint. */
function authoredGrid(
  named: readonly ThemeId[],
  isHost: boolean,
  full: boolean,
  onPick: (mode: ThemeMode, themes: readonly ThemeId[]) => void
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

/** The custom themes from the host's paste, in their own grid under their own rule rather than
 * in the bank above. Each wears its own tint, and each is always pressed: a pasted theme is not
 * one the host picked off a row, it is one they wrote and brought, so there is nothing to
 * press. It is drawn as pressed anyway, since a card in this panel that reads as off would say
 * the room is not playing it, and it is. */
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
        <div key={theme.name} class={styles.Slot}>
          <Button
            class={styles.Item}
            accent={Accents[theme.color]}
            pressed={named.includes(theme.name)}
            disabled={!isHost || (full && !named.includes(theme.name))}
            onClick={() => onPickCustom(theme)}
          >
            {/* The name in a span of its own: the card is a flex row, and a flex row has no ellipsis
             * — the text in it is an anonymous item that is clipped rather than cut, so a long
             * name ran to the card's edge. A box of its own is what truncation needs. */}
            <span class={styles.ItemName}>{theme.name}</span>
            {/* The mark inside the card, as a span rather than a second button: a button inside a
             * button is one control to the browser, so the card would swallow the pencil's press
             * and toggle the theme on every click meant to change it. A span with the button role
             * on it keeps the card one press and the pencil another, and stops its own press from
             * reaching the card. */}
            <span
              class={styles.SlotEdit}
              role="button"
              tabIndex={isHost ? 0 : -1}
              aria-label={Strings.lobby.settings.editCustomThemes}
              onClick={(event) => {
                event.stopPropagation();
                if (!isHost) return;
                onEdit(theme);
              }}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                event.stopPropagation();
                if (!isHost) return;
                onEdit(theme);
              }}
            >
              <span class={styles.SlotEditIcon} aria-hidden="true" />
            </span>
          </Button>
        </div>
      ))}
    </div>
  );
}

export { modes, authoredThemes, toggle, themeLabel, ModeButtons, ThemeGrid, CustomThemeGrid };
