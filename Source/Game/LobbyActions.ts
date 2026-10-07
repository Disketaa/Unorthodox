/** The roster's own changes: joining, changing a face, going quiet, and being removed. Separate
 * from the phases because each is a change to one player rather than a move of the room, and
 * because they exist in every phase: a refresh mid-round is joining again. */
import { HostState } from './GameState';
import type { ActionOf } from './GameActions';

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
