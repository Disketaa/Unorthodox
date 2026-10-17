/** A client's own copy of the room's custom themes, written down as they arrive rather than only
 * read out of the room's state, since a name and its questions are both looked up in this
 * browser's cache and a client that never wrote them down could draw neither. */
import type { CustomTheme } from '@/Core';
import { addCustomTheme } from '@/Core';
import type { PublicState } from '@/Game';

export function customThemesOf(state: PublicState | undefined): readonly CustomTheme[] {
  if (state === undefined || 'customThemes' in state === false) return [];
  for (const theme of state.customThemes) addCustomTheme(theme);
  return state.customThemes;
}
