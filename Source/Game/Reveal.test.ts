import { describe, it, expect } from 'vitest';
import { GameConfig, answerWriteMs, revealedLetterCount, typedOut } from '@/Game';

const write = answerWriteMs(10);

describe('an answer being written out', () => {
  it('takes a rate per letter, so neither a short word nor a sentence takes the other time', () => {
    // A fixed length gives the two answers a room writes opposite failures: three letters arriving
    // in one frame, which is a card appearing rather than a card being written, and a sentence
    // still arriving after the next card has opened.
    expect(answerWriteMs(3)).toBe(GameConfig.timing.revealWriteMinMs);
    expect(answerWriteMs(20)).toBe(20 * GameConfig.timing.revealLetterMs);
    expect(answerWriteMs(100)).toBe(GameConfig.timing.revealWriteMaxMs);
    expect(answerWriteMs(3)).toBeLessThan(answerWriteMs(20));
  });

  it('shows nothing before the card has started to come over', () => {
    expect(revealedLetterCount(10, 0, write)).toBe(0);
    expect(revealedLetterCount(10, -5, write)).toBe(0);
  });

  it('shows the whole answer by the time the card is up', () => {
    // The card finishes arriving and the writing on it has finished: an answer still landing on a
    // card the room has voted on is an answer the room voted on without reading.
    expect(revealedLetterCount(10, write, write)).toBe(10);
  });

  it('is behind for a moment rather than in front of it', () => {
    expect(revealedLetterCount(10, write / 2, write)).toBe(5);
    expect(revealedLetterCount(20, write / 4, write)).toBe(5);
  });

  it('never writes past the end of the answer', () => {
    expect(revealedLetterCount(4, write * 10, write)).toBe(4);
  });

  it('has nothing to write for an empty answer', () => {
    expect(revealedLetterCount(0, write, write)).toBe(0);
  });

  it('cuts mid-letter, which is where a sentence being written is most legible', () => {
    expect(typedOut('answer', 3)).toBe('ans');
    expect(typedOut('answer', 0)).toBe('');
    expect(typedOut('answer', 99)).toBe('answer');
    expect(typedOut('answer', -4)).toBe('');
  });

  it('writes the same answer the same way on every screen in the room', () => {
    // The letters are a function of the host's clock and the answer's own length, so a client
    // that joined late draws the answer at the place the room is at rather than from its start.
    const first = typedOut('answer', revealedLetterCount(6, write * 0.5, write));
    const late = typedOut('answer', revealedLetterCount(6, write * 0.5, write));
    expect(first).toBe('ans');
    expect(late).toBe(first);
  });
});
