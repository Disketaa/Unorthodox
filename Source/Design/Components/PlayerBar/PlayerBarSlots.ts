import { PlayerId } from '@/Core';
import type { PlayerBarEntry } from './PlayerBar';

/** The players the bar draws, and in what order: the order they are handed in, which is the
 * room's own through a round and the last leaderboard's order after one. A room past the limit
 * gets the first of that order and, failing them, the local player last. */
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
