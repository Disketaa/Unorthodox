/** The rules over what a host has named in the lobby: what one press means, whether the bank is
 * already full, and what a press on a pasted theme does. Kept beside the themes panel rather
 * than in it, so that panel is about arranging the room and this is about the rules it holds. */
import { ThemeId, ThemeMode, CustomTheme, themeNameIsTaken } from '@/Core';
import { ThemeLimit } from './ThemeGrid';

export interface NamedThemesRules {
  /** Whether the host has already named as many themes as the lobby deals. */
  full: boolean;
  /** One press on a theme, authored or pasted: it goes on beside the others, or comes back off. */
  pick: (theme: ThemeId) => void;
  /** One press on a pasted theme, which may instead open its own paste window. */
  pickCustom: (theme: CustomTheme) => void;
}

export function namedThemesRules(
  themeMode: ThemeMode,
  named: readonly ThemeId[],
  customThemes: readonly CustomTheme[],
  onPick: (mode: ThemeMode, themes: readonly ThemeId[]) => void,
  onEditCustomThemes: (theme: CustomTheme, clash?: string) => void
): NamedThemesRules {
  const full = themeMode === 'Chosen' && named.length >= ThemeLimit;
  // A press never switches the mode: naming a theme is a thing the host does on the way to
  // `Chosen`, and a press that turned the random bank off would be a mode they did not choose.
  const pick = (theme: ThemeId): void => {
    const next = named.includes(theme)
      ? named.filter((held) => held !== theme)
      : [...named, theme];
    onPick('Chosen', next);
  };
  // A custom theme whose name is already an authored theme's cannot be named, and the press that
  // would name it opens the theme's own paste window with the reason in it: the fix is a name in
  // the JSON, and the window is where the name is written.
  const pickCustom = (theme: CustomTheme): void => {
    if (themeNameIsTaken(theme.name, customThemes, theme.name)) {
      onEditCustomThemes(theme, theme.name);
      return;
    }
    pick(theme.name);
  };
  return { full, pick, pickCustom };
}
