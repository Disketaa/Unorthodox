/** The roster's own changes: joining, changing a face, going quiet, and being removed. Separate
 * from the phases because each is a change to one player rather than a move of the room, and
 * because they exist in every phase: a refresh mid-round is joining again. */
import { HostState } from './GameState';
import {
  assertNever,
  isThemeId,
  isThemeMode,
  ThemeId,
  ThemeMode,
  loadCustomThemes,
  addCustomTheme,
  removeCustomTheme,
} from '@/Core';
import type { ActionOf, GameAction } from './GameActions';
import { GameConfig } from './GameConfig';

/** Everything that changes one player rather than moving the room, in one entry. */
export function handleRoster(
  state: HostState,
  action: Extract<
    GameAction,
    {
      type:
        | 'JOIN'
        | 'SET_ONLINE'
        | 'KICK'
        | 'SET_LOOK'
        | 'SET_PACE'
        | 'SET_THEMES'
        | 'SET_CUSTOM_THEMES'
        | 'REMOVE_CUSTOM_THEME';
    }
  >
): HostState {
  switch (action.type) {
    case 'JOIN':
      return handleJoin(state, action);
    case 'SET_ONLINE':
      return handleSetOnline(state, action);
    case 'KICK':
      return handleKick(state, action);
    case 'SET_LOOK':
      return handleSetLook(state, action);
    case 'SET_PACE':
      return handleSetPace(state, action);
    case 'SET_THEMES':
      return handleSetThemes(state, action);
    case 'SET_CUSTOM_THEMES':
      return handleSetCustomThemes(state, action);
    case 'REMOVE_CUSTOM_THEME':
      return handleRemoveCustomTheme(state, action);
    default:
      return assertNever(action);
  }
}

/** The same room with a different roster, whatever phase it is in. */
function withRoster(state: HostState, players: HostState['players']): HostState {
  return { ...state, players };
}

/** A player taking their seat, or taking it back. A seat that already exists keeps the record
 * the room has of it — the name and the character it was given — and only comes back online, so
 * a refresh cannot rename a player or repaint their face from the other end of the room. */
export function handleJoin(state: HostState, action: ActionOf<'JOIN'>): HostState {
  const known = state.players.get(action.playerId);
  const player = known ?? { name: action.name, look: action.look, isOnline: true };
  return withRoster(
    state,
    new Map(state.players).set(action.playerId, { ...player, isOnline: true })
  );
}

/** Change how a player looks, which the lobby lets them do until the game starts. Once writing
 * begins the look is frozen, so everyone sees the same faces for the rest of the game and a
 * player cannot swap to a different character mid-round. */
export function handleSetLook(state: HostState, action: ActionOf<'SET_LOOK'>): HostState {
  if (state.phase !== 'Lobby') {
    return state;
  }
  const player = state.players.get(action.playerId);
  if (player === undefined) {
    return state;
  }
  return withRoster(
    state,
    new Map(state.players).set(action.playerId, { ...player, look: action.look })
  );
}

/** Record whether a player is still on the line. The player stays in the roster either way: a
 * dropped connection is not a seat given up, and the host may yet see them come back under the
 * same name. */
export function handleSetOnline(state: HostState, action: ActionOf<'SET_ONLINE'>): HostState {
  const player = state.players.get(action.playerId);
  if (player === undefined || player.isOnline === action.isOnline) {
    return state;
  }
  return withRoster(
    state,
    new Map(state.players).set(action.playerId, { ...player, isOnline: action.isOnline })
  );
}

/** Take a player out of the room at the host's word. Unlike a dropped connection, a kick gives
 * the seat up: the player is out, and so are their scores, because a room that still tallies
 * them would carry them into the next game. */
export function handleKick(state: HostState, action: ActionOf<'KICK'>): HostState {
  if (!state.players.has(action.playerId)) {
    return state;
  }
  const players = new Map(state.players);
  players.delete(action.playerId);
  const cumulativeScores = new Map(state.cumulativeScores);
  cumulativeScores.delete(action.playerId);
  return { ...state, players, cumulativeScores };
}

/** The host changing how fast the room plays. Lobby only, like the rest of the room's settings:
 * once writing has begun the durations are the ones the phase was started with, so a pace set
 * mid-game would promise a round that plays at a length nobody is counting to. */
export function handleSetPace(state: HostState, action: ActionOf<'SET_PACE'>): HostState {
  if (state.phase !== 'Lobby' || state.pace === action.pace) {
    return state;
  }
  return { ...state, pace: action.pace };
}

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
 * the lobby deals. A name is real if it is a file in the registry or a theme this browser has
 * saved, and the registry is asked first so a custom theme can never answer to a file's name.
 * Won't name a custom theme at all — the press was dropped here and the card read as a control
 * that does nothing. Cutting from the front rather than the back then decides which of two
 * presses wins when there is only room for one: the one just made, since the earlier theme is
 * still on the card and one press puts it back. Nothing downstream depends on the order, since
 * the deal filters the pool by membership rather than by position. Cut here rather than
 * trusted to the buttons, so a host cannot end up naming seven themes for a bank of six. Empty
 * stays empty: the deal reads it as every theme. */
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
function handleSetCustomThemes(
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

/** One custom theme struck out, from the room and from this browser, by its name. Lobby only,
 * for the setting's reason. Taken out of the selection as well: a theme the room no longer has
 * cannot stay named, and a named theme the room cannot deal is a card that is in the bank and
 * cannot be played. */
function handleRemoveCustomTheme(
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
