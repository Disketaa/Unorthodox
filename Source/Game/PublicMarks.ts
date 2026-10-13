import { countByGroup } from './GroupVotes';
import type { ReviewingState } from './GameState';

/** What the room is told about the marks on the board: which cards are muted and how many liked
 * each one. Both travel beside the groups rather than inside them, so a card's shape on the
 * wire does not change when it is marked, and both are omitted when empty. */
export function marksForRoom(state: ReviewingState): {
  mutedGroupIds?: number[];
  likeCounts?: { groupId: number; count: number }[];
} {
  const muted = state.groupRejections;
  const counts = countByGroup(state.groupLikes);
  return {
    ...(muted.size === 0 ? {} : { mutedGroupIds: [...muted.keys()] }),
    ...(counts.length === 0 ? {} : { likeCounts: counts }),
  };
}
