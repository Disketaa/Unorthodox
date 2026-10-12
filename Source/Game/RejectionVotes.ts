import type { PlayerId } from '@/Core';

/** Who has voted that each answer does not fit, as the host holds it: a group id to the players
 * who voted it out. A vote is counted against a group, never against a player, so the room's
 * decision is the only thing this shape has to answer. */
export type RejectionVotes = Map<number, Set<PlayerId>>;

/** This player's vote on one group, cast or withdrawn. A vote rather than a flag, so pressing an
 * answer a second time takes the vote back. Copied rather than added in place, since the set
 * held in the state is the one the room was last sent; a group left empty is dropped. */
export function toggleRejection(
  votes: RejectionVotes,
  groupId: number,
  playerId: PlayerId
): RejectionVotes {
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
