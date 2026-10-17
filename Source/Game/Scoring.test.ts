import { describe, test, expect } from 'vitest';
import { speedPoints, scoreCard, calculateRoundScores, zeroScorers } from './Scoring';
import type { CardScore } from './Scoring';
import { GameConfig } from './GameConfig';

/** One card as the round writes it: written at once, written by nobody else, worth its full
 * speed scale and no likes. A case says what it changes rather than restating the rest. */
function card(over: Partial<CardScore> = {}): CardScore {
  return { groupSize: 1, isRejected: false, speedShare: 0, likes: 0, mult: 1, ...over };
}

describe('speedPoints', () => {
  test('pays the whole scale to an answer sent on the first tick', () => {
    expect(speedPoints(0)).toBe(GameConfig.scoring.speedMaxPoints);
  });

  test('pays nothing to an answer that used the whole clock', () => {
    expect(speedPoints(1)).toBe(0);
  });

  test('reads as a curve, so the first third beats the last third', () => {
    // The reason the scale is bent: a straight line makes being early worth the same as being
    // late is not, and a bent one is the difference between them being a skill and a formality.
    expect(speedPoints(1 / 3)).toBeGreaterThan(speedPoints(2 / 3));
    expect(speedPoints(1 / 3)).toBe(11);
    expect(speedPoints(2 / 3)).toBe(4);
  });

  test('keeps paying something in the last third, since a round still ends', () => {
    // The one thing this curve must not do: a player who thought and answered late is paid
    // nothing at all, which is what a square would do and what a party game cannot afford.
    expect(speedPoints(0.9)).toBeGreaterThan(0);
  });

  test('holds outside the window, since a late answer is not a negative one', () => {
    expect(speedPoints(-1)).toBe(GameConfig.scoring.speedMaxPoints);
    expect(speedPoints(2)).toBe(0);
  });
});

describe('scoreCard', () => {
  test('pays a unique answer its speed and its likes', () => {
    expect(scoreCard(card({ speedShare: 1 / 3, likes: 2 }))).toEqual({
      points: 13,
      fromSpeed: 11,
      fromLikes: 2,
    });
  });

  test('pays a struck-out card nothing, whatever it was worth', () => {
    expect(scoreCard(card({ isRejected: true, likes: 5 })).points).toBe(0);
  });

  test('pays a pair its flat rate and nothing else', () => {
    // No speed, since the room already had the idea, and no likes, since a like is the room
    // finding something once. Both halves of the answer are already somebody else's.
    expect(scoreCard(card({ groupSize: 2, speedShare: 0, likes: 4 })).points).toBe(
      GameConfig.scoring.pairPoints
    );
  });

  test('pays three who wrote the same thing nothing at all', () => {
    expect(scoreCard(card({ groupSize: 3, likes: 6 })).points).toBe(0);
  });

  test('multiplies the speed and leaves the likes alone', () => {
    // The multiplier is the room's luck and the likes are the room's opinion, so a good answer
    // in a doubled round must not be worth more for being liked twice.
    expect(scoreCard(card({ speedShare: 0, likes: 3, mult: 2 }))).toEqual({
      points: 43,
      fromSpeed: 40,
      fromLikes: 3,
    });
  });

  test('multiplies the flat rate of a pair as well', () => {
    expect(scoreCard(card({ groupSize: 2, mult: 2 })).points).toBe(
      GameConfig.scoring.pairPoints * 2
    );
  });
});

describe('calculateRoundScores', () => {
  test('adds up every card a player wrote', () => {
    const scores = calculateRoundScores([
      { playerIds: ['p1'], card: card({ speedShare: 0 }) },
      { playerIds: ['p2', 'p3'], card: card({ groupSize: 2 }) },
      { playerIds: ['p4'], card: card({ isRejected: true }) },
    ]);
    expect(Object.fromEntries(scores)).toEqual({
      p1: GameConfig.scoring.speedMaxPoints,
      p2: GameConfig.scoring.pairPoints,
      p3: GameConfig.scoring.pairPoints,
      p4: 0,
    });
  });

  test('scores nothing for a round nobody answered', () => {
    expect(calculateRoundScores([]).size).toBe(0);
  });
});

describe('zeroScorers', () => {
  test('names nobody when every answer was rare and early', () => {
    expect(
      zeroScorers([{ groupId: 0, playerIds: ['p1'], isEmpty: false }], new Set()).size
    ).toBe(0);
  });

  test('names the blank card', () => {
    expect([
      ...zeroScorers([{ groupId: 0, playerIds: ['p1'], isEmpty: true }], new Set()),
    ]).toEqual(['p1']);
  });

  test('names the muted card', () => {
    expect([
      ...zeroScorers([{ groupId: 3, playerIds: ['p1'], isEmpty: false }], new Set([3])),
    ]).toEqual(['p1']);
  });

  test('names a shared answer, which is worth a flat rate rather than a place', () => {
    const groups = [
      { groupId: 0, playerIds: ['p1', 'p2'], isEmpty: false },
      { groupId: 1, playerIds: ['p3', 'p4'], isEmpty: false },
    ];
    // The pair is on the board as declined, and the bar is told so; whether it also paid is the
    // scorer's business and not this one's, so the two lists are deliberately not the same.
    expect([...zeroScorers(groups, new Set([0]))]).toEqual(['p1', 'p2', 'p3', 'p4']);
  });
});
