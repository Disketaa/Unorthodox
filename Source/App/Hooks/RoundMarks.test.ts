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
