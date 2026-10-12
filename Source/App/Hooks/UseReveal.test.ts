import { describe, it, expect } from 'vitest';
import { GameConfig, revealedCount } from '@/Game';

const timing = GameConfig.timing;
const start = 1_000_000;

/** A round long enough to show the room's answers at the beat the game asks for. */
const duration = timing.reviewingDurationMs;

describe('turning the answers over', () => {
  it('shows the board face down when the round starts', () => {
    expect(revealedCount(9, duration, start, start)).toBe(0);
  });

  it('holds the board face down through the lead-in', () => {
    // The pause before the first answer is the point of the round: a board the room can already
    // read is a board nobody watched being wrong about.
    expect(revealedCount(9, duration, start, start + timing.revealLeadInMs - 1)).toBe(0);
  });

  it('turns one answer over at a time', () => {
    const first = start + timing.revealLeadInMs + 1;
    expect(revealedCount(9, duration, start, first)).toBe(1);
    expect(revealedCount(9, duration, start, first + timing.revealCardMs)).toBe(2);
    expect(revealedCount(9, duration, start, first + timing.revealCardMs * 2)).toBe(3);
  });

  it('never turns two over at once', () => {
    // The count is a step, not a ramp: one answer opens per beat and the card does the rest of the
    // work in its own transition, so a room reading along is never given two cards to react to in
    // the same moment.
    const first = start + timing.revealLeadInMs + 1;
    expect(revealedCount(9, duration, start, first)).toBe(1);
    for (let card = 2; card <= 9; card += 1) {
      const beat = start + timing.revealLeadInMs + timing.revealCardMs * (card - 1);
      expect(revealedCount(9, duration, start, beat - 1)).toBe(card - 1);
      expect(revealedCount(9, duration, start, beat)).toBe(card);
    }
  });

  it('has the whole board up, and no more, once the run is over', () => {
    const last = start + timing.revealLeadInMs + timing.revealCardMs * 8;
    expect(revealedCount(9, duration, start, last)).toBe(9);
    expect(revealedCount(9, duration, start, last + 60_000)).toBe(9);
  });

  it('shows nothing at all for a round with no answers', () => {
    expect(revealedCount(0, duration, start, start + 60_000)).toBe(0);
  });

  it('leaves the room time to vote on a full board', () => {
    // The run is shortened rather than the voting: a board that is still arriving when the phase
    // ends is a board the room never got to read.
    const full = GameConfig.limits.maxPlayers;
    const last =
      start + timing.revealLeadInMs + timing.revealCardMs * (full - 1) + timing.revealVoteMs;
    expect(revealedCount(full, duration, start, last)).toBe(full);
  });

  it('shortens the run rather than running out of the round', () => {
    // A short round, and more answers than it has time for at the full beat: every answer still
    // gets up, and the room still has its voting time.
    const short = 20_000;
    const atEnd = start + short;
    expect(revealedCount(12, short, start, atEnd)).toBe(12);
  });
});

describe('the run counting from the round it belongs to', () => {
  it('deals the board face down again on the next round', () => {
    // The reveal is counted from the phase's own start, so nothing about it survives the round:
    // the same answers dealt again come up again rather than arriving already open.
    const nextRound = start + duration;
    expect(revealedCount(9, duration, nextRound, nextRound)).toBe(0);
    expect(revealedCount(9, duration, nextRound, nextRound + timing.revealLeadInMs + 1)).toBe(
      1
    );
  });

  it('is up again, the whole board, part way through the next round', () => {
    const nextRound = start + duration;
    expect(
      revealedCount(9, duration, nextRound, nextRound + timing.revealLeadInMs + 3500 * 8)
    ).toBe(9);
  });

  it('has nothing to show before the round it is counting from', () => {
    // A board asked for before its own round began is not a board dealt early: the run is counted
    // from the phase's start, so a clock that has not reached it has turned nothing over.
    expect(revealedCount(9, duration, start, start - 1)).toBe(0);
    expect(revealedCount(9, duration, start, start - 60_000)).toBe(0);
  });
});
