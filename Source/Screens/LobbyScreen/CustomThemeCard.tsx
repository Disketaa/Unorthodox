/** One pasted theme's card, in the lobby's own theme panel. Always drawn pressed: a pasted theme
 * is one the host wrote and brought rather than picked off a row, so a card here that read as
 * off would say the room is not playing it. */
import { Button } from '@/Design/Components';
import { Accents, type CustomTheme, type ThemeId } from '@/Core';
import { Strings } from '@/Content';
import styles from './LobbyThemes.module.css';

interface CustomThemeCardProps {
  theme: CustomTheme;
  named: readonly ThemeId[];
  isHost: boolean;
  full: boolean;
  onPickCustom: (theme: CustomTheme) => void;
  onEdit: (theme: CustomTheme) => void;
}

/** The mark inside the card, as a span rather than a second button: a button inside a button is
 * one control to the browser, so the card would swallow the pencil's press and toggle the theme
 * on every click meant to change it. A span with the button role keeps them two presses. */
function EditMark({ isHost, onEdit }: { isHost: boolean; onEdit: () => void }) {
  const press = (event: { stopPropagation: () => void }): void => {
    event.stopPropagation();
    if (isHost) onEdit();
  };
  const pressByKey = (event: {
    key: string;
    preventDefault: () => void;
    stopPropagation: () => void;
  }): void => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    press(event);
  };
  return (
    <span
      class={styles.SlotEdit}
      role="button"
      tabIndex={isHost ? 0 : -1}
      aria-label={Strings.lobby.settings.editCustomThemes}
      onClick={press}
      onKeyDown={pressByKey}
    >
      <span class={styles.SlotEditIcon} aria-hidden="true" />
    </span>
  );
}

export function CustomThemeCard({
  theme,
  named,
  isHost,
  full,
  onPickCustom,
  onEdit,
}: CustomThemeCardProps) {
  const held = named.includes(theme.name);
  return (
    <div class={styles.Slot}>
      <Button
        class={styles.Item}
        accent={Accents[theme.color]}
        pressed={held}
        disabled={!isHost || (full && !held)}
        onClick={() => onPickCustom(theme)}
      >
        {/* The name in a span of its own: the card is a flex row, and a flex row has no ellipsis
         * — the text in it is an anonymous item that is clipped rather than cut, so a long name
         * ran to the card's edge. A box of its own is what truncation needs. */}
        <span class={styles.ItemName}>{theme.name}</span>
        <EditMark isHost={isHost} onEdit={() => onEdit(theme)} />
      </Button>
    </div>
  );
}
