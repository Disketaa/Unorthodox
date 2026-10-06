/** Whose turn it is, in a room of any game. Kept apart from the phases on purpose: a turn is a
 * property of the room rather than of anything it is doing, so it survives every phase and the
 * next game on the site gets it by having players rather than by writing the rule again. */
import { PlayerId } from '@/Core';
import { HostState } from './GameState';

/** The order turns go in: the room's own roster order, which is the order players took their
 * seats in the lobby. Map insertion is that order for free, and a player coming back keeps the
 * place they left rather than going to the back of the line. */
export function turnOrder(players: ReadonlyMap<PlayerId, unknown>): PlayerId[] {
  return [...players.keys()];
}

/** The player whose turn follows, or null in an empty room. A turn held by somebody no longer in
 * the room falls to the first player, since the holder is not coming back to it. */
export function nextPlayerInTurn(
  current: PlayerId | null,
  order: readonly PlayerId[],
): PlayerId | null {
  if (order.length === 0) {
    return null;
  }
  const held = current === null ? -1 : order.indexOf(current);
  return order[(held + 1) % order.length];
}

/** Hand the turn on, in whichever phase the room is in. Every phase carries the turn, so this
 * needs none of them and every one of them gets it. */
export function handleNextTurn(state: HostState): HostState {
  return { ...state, turnPlayerId: nextPlayerInTurn(state.turnPlayerId, turnOrder(state.players)) };
}
