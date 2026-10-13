import type { PlayerId } from '@/Core';

/** Who has done something to each answer on the board, as the host holds it: a group id to the
 * players who did it. Counted against a group and never against a player, and shared by the two
 * marks, which are the same toggle. */
export type GroupVotes = Map<number, Set<PlayerId>>;

/** This player's mark on one group, cast or withdrawn. A vote rather than a flag, so pressing an
 * answer a second time takes it back. Copied rather than added in place, since the set held in
 * the state is the one the room was last sent; a group left empty is dropped. */
export function toggleVote(votes: GroupVotes, groupId: number, playerId: PlayerId): GroupVotes {
  const next = new Map(votes);
  const voters = new Set(next.get(groupId) ?? []);
  if (voters.delete(playerId) === false) {
    voters.add(playerId);
  }
  if (voters.size === 0) {
    next.delete(groupId);
  } else {
    next.set(groupId, voters);
  }
  return next;
}

/** How many players marked one group, across every group marked at all. What the room is shown:
 * the count, and never who, since a card that said who liked it would be saying who read it. */
export function countByGroup(votes: GroupVotes): { groupId: number; count: number }[] {
  return [...votes.entries()]
    .filter(([, players]) => players.size > 0)
    .map(([groupId, players]) => ({ groupId, count: players.size }));
}
