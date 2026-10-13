import { describe, test, expect } from 'vitest';
import { pointsForGroupSize, calculateRoundScores, zeroScorers } from './Scoring';
import { GameConfig } from './GameConfig';

describe('pointsForGroupSize', () => {
  test('returns uniquePoints for size 1', () => {
    expect(pointsForGroupSize(1, GameConfig)).toBe(3);
  });

  test('returns pairPoints for size 2', () => {
    expect(pointsForGroupSize(2, GameConfig)).toBe(1);
  });

  test('returns commonPoints for size 3 or more', () => {
    expect(pointsForGroupSize(3, GameConfig)).toBe(0);
    expect(pointsForGroupSize(5, GameConfig)).toBe(0);
  });
});

describe('calculateRoundScores', () => {
  test('calculates scores correctly', () => {
    const groups = [
      // unique -> 3 points
      { playerIds: ['p1'], isRejected: false },
      // pair -> 1 point each
      { playerIds: ['p2', 'p3'], isRejected: false },
      // common -> 0 points
      { playerIds: ['p4', 'p5', 'p6'], isRejected: false },
      // rejected -> 0 points
      { playerIds: ['p7'], isRejected: true },
    ];
    const scores = calculateRoundScores(groups, GameConfig);
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
    const scores = calculateRoundScores([], GameConfig);
    expect(scores.size).toBe(0);
  });
});

describe('zeroScorers', () => {
  test('names nobody when every answer was rare', () => {
    const groups = [{ groupId: 0, playerIds: ['p1'], isEmpty: false }];
    expect(zeroScorers(groups, new Set(), GameConfig).size).toBe(0);
  });

  test('names the blank card', () => {
    const groups = [{ groupId: 0, playerIds: ['p1'], isEmpty: true }];
    expect([...zeroScorers(groups, new Set(), GameConfig)]).toEqual(['p1']);
  });

  test('names the muted card', () => {
    const groups = [{ groupId: 3, playerIds: ['p1'], isEmpty: false }];
    expect([...zeroScorers(groups, new Set([3]), GameConfig)]).toEqual(['p1']);
  });

  test('names a pair the host muted, and not a pair that was left alone', () => {
    const groups = [
      { groupId: 0, playerIds: ['p1', 'p2'], isEmpty: false },
      { groupId: 1, playerIds: ['p3', 'p4'], isEmpty: false },
    ];
    expect([...zeroScorers(groups, new Set([0]), GameConfig)]).toEqual(['p1', 'p2']);
  });

  test('names a group three or more wrote, since it scores nothing', () => {
    const groups = [{ groupId: 0, playerIds: ['p1', 'p2', 'p3'], isEmpty: false }];
    expect([...zeroScorers(groups, new Set(), GameConfig)]).toEqual(['p1', 'p2', 'p3']);
  });

  test('does not name a pair, which the round scores', () => {
    const groups = [{ groupId: 0, playerIds: ['p1', 'p2'], isEmpty: false }];
    expect(zeroScorers(groups, new Set(), GameConfig).size).toBe(0);
  });
});
