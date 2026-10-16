/** The host pasting in custom themes: a window over the lobby with JSON text area, save and
 * cancel buttons. Host only. */
import { CustomTheme } from '@/Core';
import { CustomThemesPopupBody } from './CustomThemesPopupBody';

export interface CustomThemesPopupProps {
  /** Whether the window is open. */
  open: boolean;
  /** Closing the window without saving. */
  onClose: () => void;
  /** Saving the pasted themes and closing the window. Host only. */
  onSave: (themes: readonly CustomTheme[]) => void;
}

/** The window over the lobby: a shade behind it like the pause screen, a panel in the middle
 * with a text area for the JSON, and two buttons underneath. The host pastes, presses save, and
 * the themes go to every screen in the room. */
export function CustomThemesPopup({ open, onClose, onSave }: CustomThemesPopupProps) {
  if (!open) return null;
  return <CustomThemesPopupBody onClose={onClose} onSave={onSave} />;
}
