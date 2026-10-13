/** Per-round UI state for the local player. Submission belongs to one round, so it is stored
 * against the topic it happened in, and a new topic starts a clean slate. Muting is not here:
 * it is the host's and the room's, so it comes down with the state rather than being kept. */
export interface RoundMarks {
  /** Topic of the round the player submitted an answer in. */
  submittedTopic: string | null;
}

/** A single change to the local player's marks. */
export type RoundMark = Partial<RoundMarks>;

const noMarks: RoundMarks = {
  submittedTopic: null,
};

export function emptyMarks(): RoundMarks {
  return { ...noMarks };
}

/** Record that the player submitted an answer in the given round. */
export function markSubmitted(marks: RoundMarks, topic: string | null): RoundMarks {
  return { ...marks, submittedTopic: topic };
}

/** Whether the confirmation for the current round should be shown. Only a mark made in the round
 * now on screen counts; a mark from an earlier topic must not lock the input for the next
 * round. */
export function hasSubmittedIn(marks: RoundMarks, topic: string | null): boolean {
  return topic !== null && marks.submittedTopic === topic;
}
