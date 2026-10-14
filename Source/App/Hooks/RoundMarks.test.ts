import { describe, it, expect } from 'vitest';
import { emptyMarks, hasSubmittedIn, likedIn, markLiked, markSubmitted } from './RoundMarks';

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

  it('starts with nothing submitted and nothing liked', () => {
    // Muting is not a local mark: it is the host's judgement and comes down with the room's state,
    // so a mark kept here could only ever disagree with the board the room is shown.
    const marks = emptyMarks();
    expect(hasSubmittedIn(marks, roundOne)).toBe(false);
    expect([...likedIn(marks, roundOne)]).toEqual([]);
  });

  it('takes a like back when the same answer is pressed again', () => {
    // A like nobody may take back is a sentence rather than a like, and this is the half the room
    // cannot see: the host counts the same press the same way.
    let marks = markLiked(emptyMarks(), roundOne, 1);
    expect([...likedIn(marks, roundOne)]).toEqual([1]);
    marks = markLiked(marks, roundOne, 1);
    expect([...likedIn(marks, roundOne)]).toEqual([]);
  });

  it('keeps likes inside the round they were cast in', () => {
    // Group ids mean nothing outside their round, so the same id next round is a different answer
    // and must not arrive already liked.
    let marks = markLiked(emptyMarks(), roundOne, 0);
    marks = markLiked(marks, roundTwo, 2);
    expect([...likedIn(marks, roundTwo)]).toEqual([2]);
    expect([...likedIn(marks, roundOne)]).toEqual([]);
  });
});
