import type { PublicState } from '@/Game';
import { likedIn, type RoundMarks } from './RoundMarks';

/** What a board of answers is drawn from. The host's mutes come down with the room, and which
 * likes were this browser's own presses cannot come down at all. Who wrote a card is not asked
 * here: the board already carries the writers, as the faces in each corner are drawn from them. */
export interface BoardMarks {
  /** Which cards the host has taken off the board. */
  rejectedGroupIds: ReadonlySet<number>;
  /** How many players liked each answer, as the room counted it. */
  likedGroupIds: ReadonlyMap<number, number>;
  /** Which of those likes were this player's own, kept here because the room is sent the counts
   * and never who cast them. */
  myLikedGroupIds: ReadonlySet<number>;
}

export function boardMarks(
  publicState: PublicState | undefined,
  marks: RoundMarks,
  topic: string | null
): BoardMarks {
  return {
    rejectedGroupIds: mutedBy(publicState),
    likedGroupIds: likedBy(publicState),
    myLikedGroupIds: likedIn(marks, topic),
  };
}

/** The cards the host has muted, as the room is shown them, rather than as a mark this browser
 * kept: a card one screen can mute alone is a card the room cannot see muted together. */
function mutedBy(publicState: PublicState | undefined): ReadonlySet<number> {
  // Both halves of the round carry the marks: the count is still drawn on the same cards, and a
  // strike-out that vanished the moment the round was counted would look like the host un-muting.
  const ids =
    publicState?.phase === 'Reviewing' || publicState?.phase === 'Scores'
      ? publicState.mutedGroupIds
      : undefined;
  return new Set(ids ?? []);
}

/** How many liked each answer, as the room is shown it: the count only, since every client is
 * handed this and a card that named its likers would be saying who read it. */
function likedBy(publicState: PublicState | undefined): ReadonlyMap<number, number> {
  const counts =
    publicState?.phase === 'Reviewing' || publicState?.phase === 'Scores'
      ? publicState.likeCounts
      : undefined;
  return new Map((counts ?? []).map((entry) => [entry.groupId, entry.count]));
}
