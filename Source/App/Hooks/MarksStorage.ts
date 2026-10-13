import type { RoundMarks } from './RoundMarks';

/** This browser's own marks, in localStorage rather than in state: a player who liked an answer
 * did so for the round and not for the page, and a refresh is the tab going away rather than
 * the room. Keyed by room; the topic is inside the value and every read is filtered by it. */
const KeyFor = (roomCode: string) => `unorthodox.marks.${roomCode}`;

/** What is worth keeping. The rest of `RoundMarks` is derived each render. */
interface StoredMarks {
  submittedTopic: string | null;
  submittedText: string;
  likedTopic: string | null;
  likedGroupIds: number[];
}

/** The stored marks for a room, or nothing if there are none. A value that cannot be read is
 * treated as absent rather than as an answer: half a round's marks is worse than none, since a
 * like that half-survived would draw a badge the room has not agreed to. */
export function loadMarks(roomCode: string): RoundMarks | undefined {
  try {
    const raw = localStorage.getItem(KeyFor(roomCode));
    if (raw === null) {
      return undefined;
    }
    const stored: StoredMarks = JSON.parse(raw);
    return isStoredMarks(stored)
      ? { ...stored, likedGroupIds: new Set(stored.likedGroupIds) }
      : undefined;
  } catch {
    return undefined;
  }
}

/** Remember the marks. Storage may be unavailable, which is not worth failing over: the marks
 * then last for the page, which is where they were before this. */
export function saveMarks(roomCode: string, marks: RoundMarks): void {
  try {
    const stored: StoredMarks = {
      submittedTopic: marks.submittedTopic,
      submittedText: marks.submittedText,
      likedTopic: marks.likedTopic,
      likedGroupIds: [...marks.likedGroupIds],
    };
    localStorage.setItem(KeyFor(roomCode), JSON.stringify(stored));
  } catch {
    // Private mode or a full quota, as with every other thing kept here.
  }
}

/** Whether what came out of storage is one of ours. Checked rather than trusted, since this is
 * the one place the app reads a shape it did not just write. */
function isStoredMarks(stored: StoredMarks): boolean {
  return (
    isTopic(stored.submittedTopic) &&
    typeof stored.submittedText === 'string' &&
    isTopic(stored.likedTopic) &&
    Array.isArray(stored.likedGroupIds) &&
    stored.likedGroupIds.every((id) => typeof id === 'number')
  );
}

function isTopic(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}
