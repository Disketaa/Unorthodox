import { describe, it, expect } from 'vitest';
import { GameConfig } from './GameConfig';
import { countStepMs, scoresDurationMs } from './ScoreCount';

describe('how long the count runs for a board', () => {
  it('gives every card the board has a turn of its own', () => {
    // The count walks one card at a time, so a board of nine answers takes nine times as long as
    // one answer. A length that did not grow with the board was the room being moved into the
    // next round while four of its answers still stood on the board uncounted.
    const one = scoresDurationMs(1);
    const nine = scoresDurationMs(9);
    expect(nine - one).toBe(8 * countStepMs());
  });

  it('opens on the drama beat and ends with the board left standing', () => {
    // Both ends are part of the count rather than slack around it: the room is given a moment to
    // look at the board before anything on it is paid, and a moment to look at the finished
    // figures before the round is taken away. A tail the clock runs out during is a tail nobody
    // saw, so it has to be inside the length rather than after it.
    const timing = GameConfig.timing;
    expect(scoresDurationMs(1)).toBe(
      timing.scoreDramaDelayMs + countStepMs() + timing.scoreBoardLingerMs
    );
  });

  it('still gives a room of no cards a moment at the board', () => {
    // A phase that ran for literally nothing would move the room on the frame it arrived. The
    // floor is the beat and the look, without a card in between.
    expect(scoresDurationMs(0)).toBe(
      GameConfig.timing.scoreDramaDelayMs + GameConfig.timing.scoreBoardLingerMs
    );
    expect(countStepMs()).toBeGreaterThan(0);
  });

  it('has one beat per card for everything a card is paid in', () => {
    // The count, the addition held, the pause, the total held, and the pause before the next card
    // starts its own. Missing any of them here and the host opens a phase the count runs out of
    // before the last card, which is the whole fault this module exists to stop.
    const timing = GameConfig.timing;
    expect(countStepMs()).toBe(
      timing.scoreCountMs +
        timing.scoreAddedHoldMs +
        timing.scoreGapMs +
        timing.scoreTotalHoldMs +
        timing.scoreGapMs
    );
  });
});
