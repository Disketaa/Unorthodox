/** The roster's own changes: joining, changing a face, going quiet, and being removed. Separate
 * from the phases because each is a change to one player rather than a move of the room, and
 * because they exist in every phase: a refresh mid-round is joining again. */
import { HostState } from './GameState';
import { assertNever, isThemeId, isThemeMode, ThemeId, ThemeIds, ThemeMode, loadCustomThemes } from '@/Core';
import type { ActionOf, GameAction } from './GameActions';
import { GameConfig } from './GameConfig';

/** Everything that changes one player rather than moving the room, in one entry. */
export function handleRoster(
  state: HostState,
  action: Extract<
    GameAction,
    { type: 'JOIN' | 'SET_ONLINE' | 'KICK' | 'SET_LOOK' | 'SET_PACE' | 'SET_THEMES' | 'SET_CUSTOM_THEMES' }
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

/** The themes named, in the registry's order, kept only where this build has a bank and cut to
 * what the lobby deals. Cut here rather than trusted to the buttons, so a host cannot end up
 * naming seven themes for a bank of six. Empty stays empty: the deal reads it as every theme. */
function namedFrom(picked: readonly ThemeId[]): readonly ThemeId[] {
  // Custom themes live in this browser's cache, so load them before checking which names are real.
  loadCustomThemes();
  const named = picked.filter(isThemeId);
  return ThemeIds.filter((theme) => named.includes(theme)).slice(
    0,
    GameConfig.themes.cardsPerLobby
  );
}

/** Whether two namings are the same, which is what stops a press that changes nothing from
 * sending the room a state it would have thrown away anyway. */
function sameThemes(a: readonly ThemeId[], b: readonly ThemeId[]): boolean {
  return a.length === b.length && a.every((theme, at) => theme === b[at]);
}

/** The host pasting in custom themes. Lobby only, since a bank already drawn cannot be redrawn.
 * The themes are merged into the room's state so every client can draw them, and each client
 * saves them to its own cache so they survive a refresh. */
function handleSetCustomThemes(state: HostState, action: ActionOf<'SET_CUSTOM_THEMES'>): HostState {
  if (state.phase !== 'Lobby') {
    return state;
  }
  const themes = new Map(state.customThemes);
  for (const theme of action.themes) {
    themes.set(theme.id, theme);
  }
  return { ...state, customThemes: themes };
}
