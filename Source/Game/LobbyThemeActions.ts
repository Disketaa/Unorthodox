/** How a room is given its themes, and what a host pastes in. Separate from the roster's own
 * changes because these are settings of the room rather than changes to a player, and because
 * what a host has named is the one piece of lobby state that is written down somewhere. */
import {
  isThemeId,
  isThemeMode,
  ThemeId,
  ThemeMode,
  loadCustomThemes,
  addCustomTheme,
  removeCustomTheme,
} from '@/Core';
import type { HostState } from './GameState';
import type { ActionOf } from './GameActions';
import { GameConfig } from './GameConfig';

/** The host changing how the room is given its themes. Lobby only, for the pace's reason: a deal
 * already drawn cannot be redrawn. The rules live here rather than in the buttons, so a state
 * naming a dropped theme, or more than the bank holds, cannot be written at all. */
export function handleSetThemes(state: HostState, action: ActionOf<'SET_THEMES'>): HostState {
  if (state.phase !== 'Lobby') {
    return state;
  }
  const mode: ThemeMode = isThemeMode(action.mode) ? action.mode : 'Random';
  const themes = namedFrom(action.themes);
  if (mode === state.themeMode && sameThemes(state.themes, themes)) {
    return state;
  }
  return { ...state, themeMode: mode, themes };
}

/** The themes named, kept only where this build or this browser has the theme and cut to what
 * the lobby deals. Cutting from the front rather than the back decides which of two presses
 * wins when there is only room for one: the one just made. */
function namedFrom(picked: readonly ThemeId[]): readonly ThemeId[] {
  // Custom themes live in this browser's cache, so load them before checking which names are real.
  const custom = loadCustomThemes();
  const named: ThemeId[] = [];
  for (const theme of picked) {
    if (named.includes(theme)) continue;
    if (!isThemeId(theme) && !custom.has(theme)) continue;
    named.push(theme);
  }
  return named.slice(-GameConfig.themes.cardsPerLobby);
}

/** Whether two namings are the same, which is what stops a press that changes nothing from
 * sending the room a state it would have thrown away anyway. */
function sameThemes(a: readonly ThemeId[], b: readonly ThemeId[]): boolean {
  return a.length === b.length && a.every((theme, at) => theme === b[at]);
}

/** The host pasting in custom themes. Lobby only, since a bank already drawn cannot be redrawn.
 * The themes are merged into the room's state so every client can draw them, and each client
 * saves them to its own cache so they survive a refresh. */
export function handleSetCustomThemes(
  state: HostState,
  action: ActionOf<'SET_CUSTOM_THEMES'>
): HostState {
  if (state.phase !== 'Lobby') {
    return state;
  }
  const themes = new Map(state.customThemes);
  for (const theme of action.themes) {
    themes.set(theme.name, theme);
    // Written down here rather than only held in the room's state, because a custom theme is
    // looked up by name in this browser's cache: the naming rules and the questions both read it
    // from there, so a theme that lives only in the room can be neither named nor drawn.
    addCustomTheme(theme);
  }
  return { ...state, customThemes: themes };
}

/** One custom theme struck out, from the room and from this browser, by its name. Taken out of
 * the selection as well: a theme the room no longer has cannot stay named, and a named theme
 * the room cannot deal is a card that is in the bank and cannot be played. */
export function handleRemoveCustomTheme(
  state: HostState,
  action: ActionOf<'REMOVE_CUSTOM_THEME'>
): HostState {
  if (state.phase !== 'Lobby') {
    return state;
  }
  removeCustomTheme(action.name);
  if (!state.customThemes?.has(action.name) && !state.themes.includes(action.name)) {
    return state;
  }
  return {
    ...state,
    customThemes: new Map(
      [...(state.customThemes ?? new Map())].filter(([name]) => name !== action.name)
    ),
    themes: state.themes.filter((theme) => theme !== action.name),
  };
}
