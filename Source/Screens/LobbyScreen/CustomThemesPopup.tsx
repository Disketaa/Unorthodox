/** The host pasting in custom themes: a window over the lobby with JSON text area, save and
 * cancel buttons. Host only. */
import { CustomTheme } from '@/Core';
import { CustomThemesPopupBody } from './CustomThemesPopupBody';

export interface CustomThemesPopupProps {
  /** Whether the window is open. */
  open: boolean;
  /** The JSON the window opens on. The default template for a first paste, and the room's own
   * themes pretty printed for an edit — the same window both ways, opened on something rather
   * than on nothing. */
  json?: string;
  /** What the window opens saying, where the press that opened it was refused for a reason the
   * JSON itself does not show. The body keeps it until the text is touched. */
  problem?: string;
  /** The name of the theme the window was opened on, where it was opened on one. */
  themeName?: string;
  /** Closing the window without saving. */
  onClose: () => void;
  /** Saving the pasted themes and closing the window. Host only. */
  onSave: (themes: readonly CustomTheme[]) => void;
  /** Striking out the theme this window was opened on. Only offered when it was opened on one,
   * so the window cannot be a way to delete a theme it has never heard of. */
  onDelete?: () => void;
}

/** The window over the lobby: a shade behind it like the pause screen, a panel in the middle
 * with a text area for the JSON, and two buttons underneath. The host pastes, presses save, and
 * the themes go to every screen in the room. */
export function CustomThemesPopup({
  open,
  json,
  problem,
  themeName,
  onClose,
  onSave,
  onDelete,
}: CustomThemesPopupProps) {
  if (!open) return null;
  return (
    <CustomThemesPopupBody
      initialJson={json}
      initialProblem={problem}
      initialName={themeName}
      onClose={onClose}
      onSave={onSave}
      onDelete={onDelete}
    />
  );
}
