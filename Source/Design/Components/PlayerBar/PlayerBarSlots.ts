import { PlayerId } from '@/Core';
import type { PlayerBarEntry } from './PlayerBar';

/** The seats in standing order: most points at the left, least at the right. Ties keep the
 * room's own order, which a stable sort gives for free. Ranked over the whole roster, not the
 * seats that fit: a player passed by somebody who does not fit is still passed by them. */
export function rankedFor(players: readonly PlayerBarEntry[]): PlayerBarEntry[] {
  return [...players].sort((a, b) => b.score - a.score);
}

/** The players the bar draws, and in what order. The standing order, so that the row a room is
 * watching is the row the round is moving. A room past the count gets the first of the roster
 * and, failing them, the local player last: somebody must be left out. */
export function slotsFor(
  players: readonly PlayerBarEntry[],
  ownPlayerId: PlayerId | null,
  limit: number
): PlayerBarEntry[] {
  const size = Math.max(1, limit);
  if (players.length <= size) return [...players];
  const head = players.slice(0, size);
  const own = players.find((player) => player.id === ownPlayerId);
  // Measured against the roster rather than against the head, which is the same set for
  // everybody but the player who was dropped from it: taking the head here and asking
  // whether it holds the local player would send a player who was in it to the end.
  if (own === undefined || head.some((player) => player.id === own.id)) return head;
  return [...players.slice(0, size - 1), own];
}
