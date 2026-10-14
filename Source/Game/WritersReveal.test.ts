import { describe, it, expect } from 'vitest';
import { GameConfig } from './GameConfig';
import { landedWriters, writerDelayMs } from './Reveal';

const Hold = GameConfig.timing.revealAuthorsMs;

/** Every count below is measured from the moment the writers start arriving, which is what the
 * board measures them from and what `landedWriters` is handed. Counting from the card's own
 * beat instead is the bug the second test here is about. */
const sinceWritersStart = (ms: number): number => ms;

describe('the writers of an answer arriving', () => {
  it('holds the second one back, and that is the beat the round is about', () => {
    // Two people writing the same thing is the moment, and the wait before the second face is
    // what makes it a moment rather than a fact the room was handed on the card's arrival.
    expect(writerDelayMs(0)).toBe(0);
    expect(writerDelayMs(1)).toBeGreaterThanOrEqual(500);
    expect(authorDelayIsReasonable()).toBe(true);
  });

  it('brings the first face up with the card and not before', () => {
    expect(landedWriters(0, 3)).toBe(1);
  });

  it('has one face and not two at the moment the room is told who wrote it', () => {
    // The bug this is here for: the count was read off the card's own beat rather than off the
    // moment the writers start arriving, so by the time the card was allowed to show any of them
    // the whole wave was already over. The card struck itself out on the frame it was introduced.
    expect(landedWriters(sinceWritersStart(0), 2)).toBe(1);
    expect(landedWriters(sinceWritersStart(writerDelayMs(1) - 1), 2)).toBe(1);
  });

  it('brings the second face down on its own beat, and only then', () => {
    expect(landedWriters(sinceWritersStart(writerDelayMs(1) - 50), 2)).toBe(1);
    expect(landedWriters(sinceWritersStart(writerDelayMs(1)), 2)).toBe(2);
  });

  it('keeps a third and a tenth on a short beat, so a crowded card still finishes', () => {
    // Eight pauses of the dramatic length would be a round the room sits through.
    expect(writerDelayMs(9) - writerDelayMs(1)).toBeLessThanOrEqual(1200);
    expect(landedWriters(sinceWritersStart(writerDelayMs(9)), 10)).toBe(10);
  });

  it('says nobody has landed before the room is told anything', () => {
    // Before the reveal opens there is no corner to land anything in: the count is read from
    // after the reveal starts, so this is negative rather than zero.
    expect(landedWriters(-100, 4)).toBe(0);
    expect(landedWriters(-1, 4)).toBe(0);
  });

  it('never counts more writers than wrote it', () => {
    expect(landedWriters(sinceWritersStart(10000), 1)).toBe(1);
  });
});

function authorDelayIsReasonable(): boolean {
  return writerDelayMs(1) < Hold;
}
