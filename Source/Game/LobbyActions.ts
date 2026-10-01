import { HostState } from './GameState';
import type { ActionOf } from './GameActions';

/**
 * The lobby's roster changes: joining, changing a face, and going quiet.
 *
 * Separate from the phases that follow, because these three are the only actions
 * that exist while the roster is still changing shape, and each of them is a change
 * to one player rather than a move of the room.
 */

/*
 * Re-joining under a known seat marks that player back online, so a player who
 * closed the tab and came back stops reading as gone.
 */
export function handleJoin(state: HostState, action: ActionOf<'JOIN'>): HostState {
  if (state.phase !== 'Lobby') {
    return state;
  }
  const newPlayers = new Map(state.players);
  newPlayers.set(action.playerId, { name: action.name, look: action.look, isOnline: true });
  return {
    phase: 'Lobby',
    players: newPlayers,
    cumulativeScores: state.cumulativeScores,
    pace: state.pace,
  };
}

/**
 * Change how a player looks, which the lobby lets them do until the game starts.
 *
 * Once writing begins the look is frozen, so everyone sees the same faces for
 * the rest of the game and a player cannot swap to a different character
 * mid-round.
 */
export function handleSetLook(state: HostState, action: ActionOf<'SET_LOOK'>): HostState {
  if (state.phase !== 'Lobby') {
    return state;
  }
  const player = state.players.get(action.playerId);
  if (player === undefined) {
    return state;
  }
  const newPlayers = new Map(state.players);
  newPlayers.set(action.playerId, { ...player, look: action.look });
  return {
    phase: 'Lobby',
    players: newPlayers,
    cumulativeScores: state.cumulativeScores,
    pace: state.pace,
  };
}

/**
 * Record whether a player is still on the line.
 *
 * The player stays in the roster either way: a dropped connection is not a seat
 * given up, and the host may yet see them come back under the same name. Only the
 * lobby shows this, since a later phase has no roster left to show it in.
 */
export function handleSetOnline(state: HostState, action: ActionOf<'SET_ONLINE'>): HostState {
  if (state.phase !== 'Lobby') {
    return state;
  }
  const player = state.players.get(action.playerId);
  if (player === undefined || player.isOnline === action.isOnline) {
    return state;
  }
  const newPlayers = new Map(state.players);
  newPlayers.set(action.playerId, { ...player, isOnline: action.isOnline });
  return {
    phase: 'Lobby',
    players: newPlayers,
    cumulativeScores: state.cumulativeScores,
    pace: state.pace,
  };
}

/**
 * Take a player out of the room at the host's word.
 *
 * Unlike a dropped connection, a kick gives the seat up: the player is out, and so
 * are their scores, because a room that still tallies a player who was removed
 * would carry them into the next game. Only the lobby can do this, since a later
 * phase has no roster left to remove anyone from.
 */
export function handleKick(state: HostState, action: ActionOf<'KICK'>): HostState {
  if (state.phase !== 'Lobby' || !state.players.has(action.playerId)) {
    return state;
  }
  const newPlayers = new Map(state.players);
  newPlayers.delete(action.playerId);
  const newScores = new Map(state.cumulativeScores);
  newScores.delete(action.playerId);
  return {
    phase: 'Lobby',
    players: newPlayers,
    cumulativeScores: newScores,
    pace: state.pace,
  };
}

/**
 * The host changing how fast the room plays.
 *
 * Lobby only, like the rest of the room's settings: once writing has begun the
 * durations are the ones the phase was started with, so a pace set mid-game would
 * promise a round that plays at a length nobody is counting to.
 */
export function handleSetPace(state: HostState, action: ActionOf<'SET_PACE'>): HostState {
  if (state.phase !== 'Lobby' || state.pace === action.pace) {
    return state;
  }
  return {
    phase: 'Lobby',
    players: state.players,
    cumulativeScores: state.cumulativeScores,
    pace: action.pace,
  };
}
