/** What the custom themes window is showing, and the ways it can be opened and closed. Held
 * apart from the screen so the screen is about arranging the room and this is about the window. */
import { useState } from 'preact/hooks';
import { Strings } from '@/Content';
import type { CustomTheme } from '@/Core';

export interface CustomThemesPopupState {
  open: boolean;
  json: string | undefined;
  problem: string | undefined;
  themeName: string | undefined;
  /** The theme the window is showing, or undefined where it is adding rather than changing. */
  theme: CustomTheme | undefined;
  openBlank: () => void;
  openOn: (theme: CustomTheme, clash?: string) => void;
  close: () => void;
  /** Striking out the theme the window is showing, and closing it. Nothing where it is adding. */
  remove: (() => void) | undefined;
  save: (themes: readonly CustomTheme[]) => void;
}

export function useCustomThemesPopup(
  onRemoveCustomTheme: (name: string) => void,
  onCustomThemes: (themes: readonly CustomTheme[]) => void
): CustomThemesPopupState {
  const [open, setOpen] = useState(false);
  const [json, setJson] = useState<string | undefined>(undefined);
  const [theme, setTheme] = useState<CustomTheme | undefined>(undefined);
  // What the window is opened saying, where the press that opened it was refused. It is about the
  // name in the box rather than about the JSON's shape, so the body keeps it until the text is
  // touched and then goes back to reading the text itself.
  const [problem, setProblem] = useState<string | undefined>(undefined);

  const forget = (): void => {
    setJson(undefined);
    setTheme(undefined);
    setProblem(undefined);
  };

  // Adding: the window opens on nothing, rather than on a theme of its own.
  const openBlank = (): void => {
    forget();
    setOpen(true);
  };

  const openOn = (next: CustomTheme, clash?: string): void => {
    setJson(JSON.stringify(next, null, 2));
    setTheme(next);
    setProblem(clash === undefined ? undefined : Strings.lobby.settings.customThemesNameClash);
    setOpen(true);
  };

  const close = (): void => {
    setOpen(false);
    forget();
  };

  return {
    open,
    json,
    problem,
    themeName: theme?.name,
    theme,
    openBlank,
    openOn,
    close,
    remove: removeFor(theme, onRemoveCustomTheme, close),
    save: saveFor(theme, onRemoveCustomTheme, onCustomThemes, close),
  };
}

/** Striking the theme the window is showing out of the room and then closing it. Nothing at all
 * where the window is adding rather than changing, since there is no theme of its own to
 * strike. */
function removeFor(
  theme: CustomTheme | undefined,
  onRemoveCustomTheme: (name: string) => void,
  close: () => void
): (() => void) | undefined {
  if (theme === undefined) return undefined;
  return (): void => {
    onRemoveCustomTheme(theme.name);
    close();
  };
}

/** Saving a theme whose name the host changed is a rename rather than an addition: the old one
 * is struck out as the new one goes in, or the room would hold both under two names, with the
 * host having written only one. */
function saveFor(
  theme: CustomTheme | undefined,
  onRemoveCustomTheme: (name: string) => void,
  onCustomThemes: (themes: readonly CustomTheme[]) => void,
  close: () => void
): (themes: readonly CustomTheme[]) => void {
  return (themes: readonly CustomTheme[]): void => {
    if (theme !== undefined && themes.some((saved) => saved.name !== theme.name)) {
      onRemoveCustomTheme(theme.name);
    }
    onCustomThemes(themes);
    close();
  };
}
