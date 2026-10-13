import { countByGroup } from './GroupVotes';
import type { ReviewingState } from './GameState';

/** What the room is told about the marks on the board: which cards are muted and how many liked
 * each one. A muted card's likes are dropped here, so no reading of the wire carries a count on
 * a card the host struck out and the room cannot take back. */
export function marksForRoom(state: ReviewingState): {
  mutedGroupIds?: number[];
  likeCounts?: { groupId: number; count: number }[];
} {
  const muted = state.groupRejections;
  const counts = countByGroup(state.groupLikes).filter((entry) => !muted.has(entry.groupId));
  return {
    ...(muted.size === 0 ? {} : { mutedGroupIds: [...muted.keys()] }),
    ...(counts.length === 0 ? {} : { likeCounts: counts }),
  };
}
