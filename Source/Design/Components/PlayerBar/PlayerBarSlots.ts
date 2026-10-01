import { PlayerId } from '@/Core';
import type { PlayerBarEntry } from './PlayerBar';

/**
 * The players the bar draws, and in what order.
 *
 * Roster order is the room's own order and nothing is sorted here: the same player in
 * the same place in every screen that shows them is worth more than a score order that
 * would move a face every round.
 *
 * A room larger than the bar gets the first players of the roster and, if this browser
 * is not one of them, the local player in the last slot. Somebody has to be the one left
 * out, and it is the player who can find somebody to say so, rather than a player who is
 * not looking at the screen.
 */
export function slotsFor(
  players: readonly PlayerBarEntry[],
  ownPlayerId: PlayerId | null,
  limit: number,
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