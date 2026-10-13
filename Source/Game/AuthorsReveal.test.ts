import { describe, it, expect } from 'vitest';
import { authorsArrived } from './Reveal';
import { GameConfig } from './GameConfig';

describe('authorsArrived', () => {
  it('is off while the answer is still being written at the room', () => {
    // The point of the delay: an answer says what it says before the room finds out who agreed
    // with it. A card that named its writers while the sentence was still arriving would be
    // answering a question nobody had finished being asked.
    const hold = GameConfig.timing.revealAuthorsMs;
    const write = GameConfig.timing.revealWriteMaxMs;
    expect(write).toBeLessThanOrEqual(hold);
    expect(authorsArrived(0)).toBe(false);
    expect(authorsArrived(write - 1)).toBe(false);
  });

  it('is on a beat later, and stays on', () => {
    expect(authorsArrived(GameConfig.timing.revealAuthorsMs)).toBe(true);
    expect(authorsArrived(GameConfig.timing.revealAuthorsMs + 4000)).toBe(true);
  });

  it('waits long enough to be worth the wait', () => {
    // A delay short enough to pass for a hiccup is not a delay the room will notice at all.
    expect(GameConfig.timing.revealAuthorsMs).toBeGreaterThanOrEqual(1200);
  });
});
