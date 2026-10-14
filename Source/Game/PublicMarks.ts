import { countByGroup } from './GroupVotes';
import type { ReviewingState } from './GameState';

/** What the room is told about the marks on the board: which cards are off it and how many liked
 * each one. `declined` is every answer the round has turned down, shared answers included, so
 * the card and the bar are told what the scorer is told rather than each working it out. */
export function marksForRoom(
  state: ReviewingState,
  declined: ReadonlySet<number>
): {
  mutedGroupIds?: number[];
  likeCounts?: { groupId: number; count: number }[];
} {
  const counts = countByGroup(state.groupLikes).filter((entry) => !declined.has(entry.groupId));
  return {
    ...(declined.size === 0 ? {} : { mutedGroupIds: [...declined] }),
    ...(counts.length === 0 ? {} : { likeCounts: counts }),
  };
}
