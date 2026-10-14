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

/** A round long enough to show the room's answers at the beat the game asks for. */
const duration = timing.reviewingDurationMs;

/** A board of this many answers, none of which anybody else wrote — the cheapest board there is,
 * and the one the beat is sized against when a round has time to spare. */
function soleWriters(count: number): number[] {
  return Array.from({ length: count }, () => 1);
}

describe('turning the answers over', () => {
  it('shows the board face down when the round starts', () => {
    expect(revealedCount(soleWriters(9), duration, start, start)).toBe(0);
  });

  it('holds the board face down through the lead-in', () => {
    // The pause before the first answer is the point of the round: a board the room can already
    // read is a board nobody watched being wrong about.
    expect(
      revealedCount(soleWriters(9), duration, start, start + timing.revealLeadInMs - 1)
    ).toBe(0);
  });

  it('turns one answer over at a time', () => {
    const first = start + timing.revealLeadInMs + 1;
    expect(revealedCount(soleWriters(9), duration, start, first)).toBe(1);
    expect(revealedCount(soleWriters(9), duration, start, first + timing.revealCardMs)).toBe(2);
    expect(
      revealedCount(soleWriters(9), duration, start, first + timing.revealCardMs * 2)
    ).toBe(3);
  });

  it('never turns two over at once', () => {
    // The count is a step, not a ramp: one answer opens per beat and the card does the rest of the
    // work in its own transition, so a room reading along is never given two cards to react to in
    // the same moment.
    const first = start + timing.revealLeadInMs + 1;
    expect(revealedCount(soleWriters(9), duration, start, first)).toBe(1);
    for (let card = 2; card <= 9; card += 1) {
      const beat = start + timing.revealLeadInMs + timing.revealCardMs * (card - 1);
      expect(revealedCount(soleWriters(9), duration, start, beat - 1)).toBe(card - 1);
      expect(revealedCount(soleWriters(9), duration, start, beat)).toBe(card);
    }
  });

  it('has the whole board up, and no more, once the run is over', () => {
    const last = start + timing.revealLeadInMs + timing.revealCardMs * 8;
    expect(revealedCount(soleWriters(9), duration, start, last)).toBe(9);
    expect(revealedCount(soleWriters(9), duration, start, last + 60_000)).toBe(9);
  });

  it('shows nothing at all for a round with no answers', () => {
    expect(revealedCount(soleWriters(0), duration, start, start + 60_000)).toBe(0);
  });

  it('leaves the room time to vote on a full board', () => {
    // The run is shortened rather than the voting: a board that is still arriving when the phase
    // ends is a board the room never got to read.
    const full = GameConfig.limits.maxPlayers;
    const last =
      start + timing.revealLeadInMs + timing.revealCardMs * (full - 1) + timing.revealVoteMs;
    expect(revealedCount(soleWriters(full), duration, start, last)).toBe(full);
  });

  it('refuses to shorten the run past what a card needs to be read', () => {
    // A round far too short for the board it was dealt. The beat is a floor as well as a ceiling,
    // so the run overruns the round rather than speeding cards up past the moment their writers
    // are named and their like is offered: a card arriving before the last one has been read is a
    // board nobody can follow, and a board that is still arriving when the phase ends is a board
    // with cards on it nobody has read at all. Both are bad and only one of them is recoverable.
    const short = 20_000;
    const board = soleWriters(12);
    const beat = answerRevealBeat(board, short);
    expect(beat).toBeGreaterThanOrEqual(cardRevealMs(1));
    expect(revealedCount(board, short, start, start + short)).toBeLessThan(12);
  });
});

describe('the beat between answers', () => {
  it('is the room left over to read by, when the round has time to spare', () => {
    expect(answerRevealBeat(soleWriters(9), duration)).toBe(timing.revealCardMs);
  });

  it('is as long as the largest thing on the board needs, not the average', () => {
    // One answer nine people agreed on, beside eight nobody shared. The beat is taken from the
    // card the room is waiting on: sized for the other eight it would turn over while its faces
    // were still landing and its like had not been offered.
    const board = [...soleWriters(8), 9];
    expect(answerRevealBeat(board, duration)).toBe(cardRevealMs(9));
    expect(cardRevealMs(9)).toBeGreaterThan(cardRevealMs(1));
  });

  it('is not shortened for a board that needs more than the round can give it', () => {
    // Fast is the tightest pace the game plays, and even there the whole board with a heavily
    // shared answer on it still comes up inside the round it is given: raising the floor never
    // costs the room an answer, it only ever costs the spare time between them.
    for (const shared of [2, 5, 9]) {
      const board = [...soleWriters(8), shared];
      const round = reviewingDurationMs(board.length, 'Fast');
      const beat = answerRevealBeat(board, round, GameConfig.paces.Fast.voteMs);
      const run = timing.revealLeadInMs + (board.length - 1) * beat + cardRevealMs(shared);
      expect(run).toBeLessThanOrEqual(round);
    }
  });
});

describe('how long the round runs', () => {
  const full = GameConfig.limits.maxPlayers;

  it('is five seconds for the first player and five for everybody after', () => {
    // A floor for being in the room at all, then a fixed cost per head. The old figure was one
    // number for every room: a board of four answers turned over in fifteen seconds and then got
    // seventy-five seconds of countdown, which is the one thing a party game cannot sell a next
    // round on.
    expect(reviewingDurationMs(1, 'Fast')).toBe(5_000);
    expect(reviewingDurationMs(2, 'Fast')).toBe(10_000);
    expect(reviewingDurationMs(3, 'Fast')).toBe(15_000);
    expect(reviewingDurationMs(full, 'Fast')).toBe(5_000 + 5_000 * (full - 1));
  });

  it('starts the normal pace five seconds later off the same five a head', () => {
    // What Normal buys is a settled start before anything is asked of the room, and not a slower
    // count of it: the two paces differ by a flat five at every room size, so a host can say
    // "ten seconds longer" and be right whatever the headcount is.
    expect(reviewingDurationMs(1, 'Standard')).toBe(10_000);
    expect(reviewingDurationMs(2, 'Standard')).toBe(15_000);
    for (let players = 1; players <= full; players += 1) {
      expect(
        reviewingDurationMs(players, 'Standard') - reviewingDurationMs(players, 'Fast')
      ).toBe(5_000);
    }
    expect(reviewingDurationMs(full, 'Standard')).toBe(10_000 + 5_000 * (full - 1));
  });

  it('grows with the room, never shrinks', () => {
    for (const pace of ['Fast', 'Standard'] as const) {
      for (let players = 1; players < full; players += 1) {
        expect(reviewingDurationMs(players + 1, pace)).toBeGreaterThan(
          reviewingDurationMs(players, pace)
        );
      }
    }
  });

  it('is not shortened by the room agreeing with itself', () => {
    // Timed on the people, not on the cards they wrote: two of them writing the same thing is one
    // card instead of two, and a wait that shrank by exactly the moment the room enjoyed most
    // would be the wrong trade. The players are what was agreed to at the table.
    expect(reviewingDurationMs(5, 'Fast')).toBe(25_000);
  });

  it('leaves the round long enough for the board it is given', () => {
    // The floor from the beat and the figure from the roster cannot collide: the busiest board a
    // room of this size can deal is one card per player, and even that finishes inside the round
    // the room was told about.
    for (const pace of ['Fast', 'Standard'] as const) {
      for (let players = 2; players <= full; players += 1) {
        const board = soleWriters(players);
        const round = reviewingDurationMs(players, pace);
        const beat = answerRevealBeat(board, round, GameConfig.paces[pace].voteMs);
        const run = timing.revealLeadInMs + board.length * beat;
        expect(run).toBeLessThanOrEqual(round);
      }
    }
  });
});

describe('the run counting from the round it belongs to', () => {
  it('deals the board face down again on the next round', () => {
    // The reveal is counted from the phase's own start, so nothing about it survives the round:
    // the same answers dealt again come up again rather than arriving already open.
    const nextRound = start + duration;
    expect(revealedCount(soleWriters(9), duration, nextRound, nextRound)).toBe(0);
    expect(
      revealedCount(soleWriters(9), duration, nextRound, nextRound + timing.revealLeadInMs + 1)
    ).toBe(1);
  });

  it('is up again, the whole board, part way through the next round', () => {
    const nextRound = start + duration;
    expect(
      revealedCount(
        soleWriters(9),
        duration,
        nextRound,
        nextRound + timing.revealLeadInMs + 3500 * 8
      )
    ).toBe(9);
  });

  it('has nothing to show before the round it is counting from', () => {
    // A board asked for before its own round began is not a board dealt early: the run is counted
    // from the phase's start, so a clock that has not reached it has turned nothing over.
    expect(revealedCount(soleWriters(9), duration, start, start - 1)).toBe(0);
    expect(revealedCount(soleWriters(9), duration, start, start - 60_000)).toBe(0);
  });
});
