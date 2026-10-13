import { describe, it, expect } from 'vitest';
import { emptyMarks, hasSubmittedIn, markSubmitted } from './RoundMarks';

const roundOne = 'First topic';
const roundTwo = 'Second topic';

describe('Round marks', () => {
  it('reports the submission for the round it was made in', () => {
    const marks = markSubmitted(emptyMarks(), roundOne);
    expect(hasSubmittedIn(marks, roundOne)).toBe(true);
  });

  it('does not carry a submission into the next round', () => {
    // This is the bug: a mark kept across rounds left the player stuck on the
    // previous round's confirmation, unable to answer the new topic.
    const marks = markSubmitted(emptyMarks(), roundOne);
    expect(hasSubmittedIn(marks, roundTwo)).toBe(false);
  });

  it('allows submitting again in the next round', () => {
    const afterFirst = markSubmitted(emptyMarks(), roundOne);
    const afterSecond = markSubmitted(afterFirst, roundTwo);
    expect(hasSubmittedIn(afterSecond, roundTwo)).toBe(true);
  });

  it('reports no submission while no topic is on screen', () => {
    const marks = markSubmitted(emptyMarks(), roundOne);
    expect(hasSubmittedIn(marks, null)).toBe(false);
  });

  it('starts with nothing submitted and nothing muted', () => {
    // Muting is not a local mark: it is the host's judgement and comes down with the room's state,
    // so a mark kept in this browser could only ever disagree with the board the room is shown.
    const marks = emptyMarks();
    expect(hasSubmittedIn(marks, roundOne)).toBe(false);
    expect(Object.keys(marks)).toEqual(['submittedTopic']);
  });
});
