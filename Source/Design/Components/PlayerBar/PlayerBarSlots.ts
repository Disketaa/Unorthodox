import { PlayerId } from '@/Core';
import type { PlayerBarEntry } from './PlayerBar';

/** The players the bar draws, and in what order. Roster order is the room's own, unsorted, since
 * a face that moves about is a face nobody finds themselves in. A room past the count gets the
 * first of the roster and, failing them, the local player last: somebody must be left out. */
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
