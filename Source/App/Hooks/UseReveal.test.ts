import { describe, it, expect } from 'vitest';
import {
  GameConfig,
  answerRevealBeat,
  cardRevealMs,
  revealedCount,
  reviewingDurationMs,
} from '@/Game';

const timing = GameConfig.timing;
const start = 1_000_000;

/** A board of this many answers, none of which anybody else wrote — the cheapest board there is,
 * and the one the beat is sized against when a round has time to spare. */
function soleWriters(count: number): number[] {
  return Array.from({ length: count }, () => 1);
}

describe('turning the answers over', () => {
  it('shows the board face down when the round starts', () => {
    expect(revealedCount(soleWriters(9), start, start)).toBe(0);
  });

  it('holds the board face down through the lead-in', () => {
    // The pause before the first answer is the point of the round: a board the room can already
    // read is a board nobody watched being wrong about.
    expect(revealedCount(soleWriters(9), start, start + timing.revealLeadInMs - 1)).toBe(0);
  });

  it('turns one answer over at a time', () => {
    const first = start + timing.revealLeadInMs + 1;
    expect(revealedCount(soleWriters(9), start, first)).toBe(1);
    expect(revealedCount(soleWriters(9), start, first + timing.revealCardMs)).toBe(2);
    expect(revealedCount(soleWriters(9), start, first + timing.revealCardMs * 2)).toBe(3);
  });

  it('never turns two over at once', () => {
    // The count is a step, not a ramp: one answer opens per beat and the card does the rest of the
    // work in its own transition, so a room reading along is never given two cards to react to in
    // the same moment.
    const first = start + timing.revealLeadInMs + 1;
    expect(revealedCount(soleWriters(9), start, first)).toBe(1);
    for (let card = 2; card <= 9; card += 1) {
      const beat = start + timing.revealLeadInMs + timing.revealCardMs * (card - 1);
      expect(revealedCount(soleWriters(9), start, beat - 1)).toBe(card - 1);
      expect(revealedCount(soleWriters(9), start, beat)).toBe(card);
    }
  });

  it('has the whole board up, and no more, once the run is over', () => {
    const last = start + timing.revealLeadInMs + timing.revealCardMs * 8;
    expect(revealedCount(soleWriters(9), start, last)).toBe(9);
    expect(revealedCount(soleWriters(9), start, last + 60_000)).toBe(9);
  });

  it('shows nothing at all for a round with no answers', () => {
    expect(revealedCount(soleWriters(0), start, start + 60_000)).toBe(0);
  });

  it('has the whole board up before the round ends', () => {
    // The run is not cut short to make room for the voting: a board that is still arriving when
    // the phase ends is a board the room never got to read.
    const board = soleWriters(GameConfig.limits.maxPlayers);
    const round = reviewingDurationMs(board, GameConfig.paces.Fast);
    const last = start + timing.revealLeadInMs + answerRevealBeat(board) * (board.length - 1);
    expect(revealedCount(board, start, last)).toBe(board.length);
    expect(last).toBeLessThan(start + round);
  });
});

describe('the beat between answers', () => {
  it('is the nominal beat of a card coming in', () => {
    expect(answerRevealBeat(soleWriters(9))).toBe(timing.revealCardMs);
  });

  it('is as long as the largest thing on the board needs, not the average', () => {
    // One answer nine people agreed on, beside eight nobody shared. The beat is taken from the
    // card the room is waiting on: sized for the other eight it would turn over while its faces
    // were still landing and its like had not been offered.
    const board = [...soleWriters(8), 9];
    expect(answerRevealBeat(board)).toBe(cardRevealMs(9));
    expect(cardRevealMs(9)).toBeGreaterThan(cardRevealMs(1));
  });

  it('never comes on faster than a card needs to be read', () => {
    // The beat is a floor as well as a ceiling: a card arriving before the last one has been read
    // is a board nobody can follow, and a board that is still arriving when the phase ends is a
    // board with cards on it nobody has read at all.
    for (const shared of [2, 5, 9]) {
      const board = [...soleWriters(8), shared];
      expect(answerRevealBeat(board)).toBeGreaterThanOrEqual(cardRevealMs(shared));
    }
  });
});

describe('how long the round runs', () => {
  const full = GameConfig.limits.maxPlayers;
  const fast = GameConfig.paces.Fast;
  const standard = GameConfig.paces.Standard;

  it('is the time it takes to show every card, and the room’s beat of voting', () => {
    // The board decides, not the room: a room of four who each wrote their own has four cards and
    // the time to show them, and a room of four who all wrote the same thing has one card and is
    // over sooner.
    const board = soleWriters(4);
    const beat = answerRevealBeat(board);
    expect(reviewingDurationMs(board, standard)).toBe(
      timing.revealLeadInMs + 3 * beat + standard.reviewTailMs
    );
  });

  it('grows with the board, never shrinks', () => {
    for (const pace of [fast, standard]) {
      for (let cards = 1; cards < full; cards += 1) {
        expect(reviewingDurationMs(soleWriters(cards + 1), pace)).toBeGreaterThan(
          reviewingDurationMs(soleWriters(cards), pace)
        );
      }
    }
  });

  it('is shortened by the room agreeing with itself', () => {
    // The old figure was timed on the people, and two of them writing the same thing was one card
    // instead of two and the wait did not move: a wait that shrank by exactly the moment the room
    // enjoyed most was the wrong trade. The board is what is on the screen now, so the wait is
    // what the board costs.
    const together = [3];
    const apart = [1, 1, 1];
    expect(reviewingDurationMs(together, standard)).toBeLessThan(
      reviewingDurationMs(apart, standard)
    );
  });

  it('gives the normal pace five seconds more of voting, and the same board', () => {
    // What Normal buys is a settled beat to vote in, and not a slower count of it: the two paces
    // differ by a flat five at every board size, so a host can say "five seconds longer" and be
    // right whatever the board is.
    for (let cards = 1; cards <= full; cards += 1) {
      expect(
        reviewingDurationMs(soleWriters(cards), standard) -
          reviewingDurationMs(soleWriters(cards), fast)
      ).toBe(5_000);
    }
  });

  it('leaves the round long enough for the board it is given', () => {
    // The board is up before the phase ends, by the room's beat of voting: the busiest board a
    // room can deal is one card per player, and even that is finished inside the round.
    for (const pace of [fast, standard]) {
      for (let cards = 1; cards <= full; cards += 1) {
        const board = soleWriters(cards);
        const run = timing.revealLeadInMs + (cards - 1) * answerRevealBeat(board);
        expect(run).toBeLessThanOrEqual(reviewingDurationMs(board, pace));
      }
    }
  });
});

describe('the run counting from the round it belongs to', () => {
  it('deals the board face down again on the next round', () => {
    // The reveal is counted from the phase's own start, so nothing about it survives the round:
    // the same answers dealt again come up again rather than arriving already open.
    const nextRound = start + 90_000;
    expect(revealedCount(soleWriters(9), nextRound, nextRound)).toBe(0);
    expect(
      revealedCount(soleWriters(9), nextRound, nextRound + timing.revealLeadInMs + 1)
    ).toBe(1);
  });

  it('is up again, the whole board, part way through the next round', () => {
    const nextRound = start + 90_000;
    expect(
      revealedCount(
        soleWriters(9),
        nextRound,
        nextRound + timing.revealLeadInMs + timing.revealCardMs * 8
      )
    ).toBe(9);
  });

  it('has nothing to show before the round it is counting from', () => {
    // A board asked for before its own round began is not a board dealt early: the run is counted
    // from the phase's start, so a clock that has not reached it has turned nothing over.
    expect(revealedCount(soleWriters(9), start, start - 1)).toBe(0);
    expect(revealedCount(soleWriters(9), start, start - 60_000)).toBe(0);
  });
});
