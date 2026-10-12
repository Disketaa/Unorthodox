import { describe, it, expect } from 'vitest';
import {
  emptyMarks,
  hasSubmittedIn,
  markRejected,
  markSubmitted,
  rejectedIn,
} from './RoundMarks';

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

  it('keeps rejections inside the round they were cast in', () => {
    const marks = markRejected(emptyMarks(), roundOne, 0);
    expect([...rejectedIn(marks, roundOne)]).toEqual([0]);
    expect([...rejectedIn(marks, roundTwo)]).toEqual([]);
  });

  it('collects several rejections in one round', () => {
    let marks = markRejected(emptyMarks(), roundOne, 0);
    marks = markRejected(marks, roundOne, 2);
    expect([...rejectedIn(marks, roundOne)]).toEqual([0, 2]);
  });

  it('does not let a stale rejection block voting in the next round', () => {
    const marks = markRejected(emptyMarks(), roundOne, 0);
    const next = markRejected(marks, roundTwo, 1);
    expect([...rejectedIn(next, roundTwo)]).toEqual([1]);
  });

  it('takes a vote back when the same answer is pressed again', () => {
    // A player who changed their mind mid-round has to be able to say so, and a vote nobody may
    // take back is a sentence rather than a vote. The host counts the same press the same way.
    let marks = markRejected(emptyMarks(), roundOne, 1);
    expect([...rejectedIn(marks, roundOne)]).toEqual([1]);
    marks = markRejected(marks, roundOne, 1);
    expect([...rejectedIn(marks, roundOne)]).toEqual([]);
  });

  it('leaves the other answers alone when one is taken back', () => {
    let marks = markRejected(emptyMarks(), roundOne, 0);
    marks = markRejected(marks, roundOne, 1);
    marks = markRejected(marks, roundOne, 0);
    expect([...rejectedIn(marks, roundOne)]).toEqual([1]);
  });

  it('starts the next round with no vote on it at all', () => {
    // Group ids are per round, so the same id in the next round is a different answer and must
    // not arrive already voted for.
    let marks = markRejected(emptyMarks(), roundOne, 2);
    marks = markRejected(marks, roundTwo, 2);
    expect([...rejectedIn(marks, roundTwo)]).toEqual([2]);
    marks = markRejected(marks, roundTwo, 2);
    expect([...rejectedIn(marks, roundTwo)]).toEqual([]);
  });
});

describe('Round mark isolation', () => {
  it('starts empty and does not share its set between rounds', () => {
    const first = emptyMarks();
    const second = emptyMarks();
    const marked = markRejected(first, roundOne, 0);
    expect(marked.rejectedGroupIds).not.toBe(second.rejectedGroupIds);
    expect(hasSubmittedIn(second, roundOne)).toBe(false);
  });
});
