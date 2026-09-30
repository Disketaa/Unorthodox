import { describe, test, expect } from 'vitest';
import { pointsForGroupSize, calculateRoundScores } from './Scoring';

describe('pointsForGroupSize', () => {
  const config = {
    scoring: {
      uniquePoints: 3,
      pairPoints: 1,
      commonPoints: 0,
    },
    timing: { writingDurationMs: 0, reviewingDurationMs: 0, graceMs: 0, uiTickMs: 0 },
  };

  test('returns uniquePoints for size 1', () => {
    expect(pointsForGroupSize(1, config)).toBe(3);
  });

  test('returns pairPoints for size 2', () => {
    expect(pointsForGroupSize(2, config)).toBe(1);
  });

  test('returns commonPoints for size 3 or more', () => {
    expect(pointsForGroupSize(3, config)).toBe(0);
    expect(pointsForGroupSize(5, config)).toBe(0);
  });
});

describe('calculateRoundScores', () => {
  const config = {
    scoring: { uniquePoints: 3, pairPoints: 1, commonPoints: 0 },
    timing: { writingDurationMs: 0, reviewingDurationMs: 0, graceMs: 0, uiTickMs: 0 },
  };

  test('calculates scores correctly', () => {
    const groups = [
      { playerIds: ['p1'], isRejected: false }, // unique -> 3 points
      { playerIds: ['p2', 'p3'], isRejected: false }, // pair -> 1 point each
      { playerIds: ['p4', 'p5', 'p6'], isRejected: false }, // common -> 0 points
      { playerIds: ['p7'], isRejected: true }, // rejected -> 0 points
    ];
    const scores = calculateRoundScores(groups, config);
    // Convert to object for easy assertion
    const scoresObj = Object.fromEntries(scores);
    expect(scoresObj.p1).toBe(3);
    expect(scoresObj.p2).toBe(1);
    expect(scoresObj.p3).toBe(1);
    expect(scoresObj.p4).toBe(0);
    expect(scoresObj.p5).toBe(0);
    expect(scoresObj.p6).toBe(0);
    expect(scoresObj.p7).toBe(0);
  });

  test('returns empty map for empty groups', () => {
    const scores = calculateRoundScores([], config);
    expect(scores.size).toBe(0);
  });
});