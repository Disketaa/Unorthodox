/** Per-round UI state for the local player. Submission and likes belong to one round, so they
 * are stored against the topic they happened in and a new topic starts a clean slate. Muting is
 * not here: it is the room's, so it comes down with the state rather than being kept. */
export interface RoundMarks {
  /** Topic of the round the player submitted an answer in. */
  submittedTopic: string | null;
  /** The answer the player sent in that round, which is the only way this browser can recognise
   * its own card: the room is never told who wrote what. */
  submittedText: string;
  /** Topic of the round the player liked answers in. */
  likedTopic: string | null;
  /** Answers the player liked in that round. */
  likedGroupIds: ReadonlySet<number>;
}

/** A single change to the local player's marks. */
export type RoundMark = Partial<RoundMarks>;

const noMarks: RoundMarks = {
  submittedTopic: null,
  submittedText: '',
  likedTopic: null,
  likedGroupIds: new Set(),
};

export function emptyMarks(): RoundMarks {
  return { ...noMarks, likedGroupIds: new Set() };
}

/** Record that the player submitted an answer in the given round, and what they sent. */
export function markSubmitted(
  marks: RoundMarks,
  topic: string | null,
  text = marks.submittedText
): RoundMarks {
  return { ...marks, submittedTopic: topic, submittedText: text };
}

/** Record one like, cast or taken back. A press toggles, so pressing the same answer twice takes
 * the like back, and a new topic starts a new list since group ids mean nothing outside their
 * round. */
export function markLiked(
  marks: RoundMarks,
  topic: string | null,
  groupId: number
): RoundMarks {
  const carriedOver = marks.likedTopic === topic ? marks.likedGroupIds : noIds();
  const next = new Set(carriedOver);
  if (next.delete(groupId) === false) {
    next.add(groupId);
  }
  return { ...marks, likedTopic: topic, likedGroupIds: next };
}

function noIds(): ReadonlySet<number> {
  return new Set();
}

/** Whether the confirmation for the current round should be shown. Only a mark made in the round
 * now on screen counts; a mark from an earlier topic must not lock the input for the next
 * round. */
export function hasSubmittedIn(marks: RoundMarks, topic: string | null): boolean {
  return topic !== null && marks.submittedTopic === topic;
}

/** Answers this player liked in the round now on screen, or none if the likes are another
 * round's. */
export function likedIn(marks: RoundMarks, topic: string | null): ReadonlySet<number> {
  return marks.likedTopic === topic ? marks.likedGroupIds : noMarks.likedGroupIds;
}
