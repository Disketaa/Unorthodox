/** Per-round UI state for the local player. Submission and rejection belong to one round, so
 * they are stored against the topic they happened in, and a new topic starts a clean slate.
 * Apart from the hook so the rule is testable without a DOM. */
export interface RoundMarks {
  /** Topic of the round the player submitted an answer in. */
  submittedTopic: string | null;
  /** Topic of the round the player rejected groups in. */
  rejectedTopic: string | null;
  /** Groups the player rejected in that round. */
  rejectedGroupIds: ReadonlySet<number>;
}

/** A single change to the local player's marks. */
export type RoundMark = Partial<RoundMarks>;

const noMarks: RoundMarks = {
  submittedTopic: null,
  rejectedTopic: null,
  rejectedGroupIds: new Set(),
};

export function emptyMarks(): RoundMarks {
  return { ...noMarks, rejectedGroupIds: new Set() };
}

/** Record that the player submitted an answer in the given round. */
export function markSubmitted(marks: RoundMarks, topic: string | null): RoundMarks {
  return { ...marks, submittedTopic: topic };
}

/** Record that the player rejected a group in the given round. A rejection starts a new list,
 * because group ids are only meaningful inside one round's list of groups. Carrying them over
 * would make the next round show votes that were never cast. */
export function markRejected(
  marks: RoundMarks,
  topic: string | null,
  groupId: number
): RoundMarks {
  const carriedOver = marks.rejectedTopic === topic ? marks.rejectedGroupIds : noIds();
  return {
    ...marks,
    rejectedTopic: topic,
    rejectedGroupIds: new Set([...carriedOver, groupId]),
  };
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

/** Rejections of the current round, or none if the votes belong to another round. */
export function rejectedIn(marks: RoundMarks, topic: string | null): ReadonlySet<number> {
  return marks.rejectedTopic === topic ? marks.rejectedGroupIds : noMarks.rejectedGroupIds;
}
