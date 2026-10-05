import { describe, test, expect } from 'vitest';
import { toPublicState } from './PublicState';
import { HostState } from './GameState';

describe('toPublicState Scores state', () => {
  test('converts correctly', () => {
    const state: HostState = {
      phase: 'Scores',
      durationMs: 30000,
      startedAt: 1000,
      scores: new Map([['p1', 3], ['p2', 1]]),
      players: new Map(),
      cumulativeScores: new Map(),
    };
    const publicState = toPublicState(state);
    expect(publicState.phase).toBe('Scores');
    if (publicState.phase === 'Scores') {
      // After checking phase, TypeScript should narrow the type to PublicScoresState
      expect(publicState.durationMs).toBe(30000);
      expect(publicState.scores.length).toBe(2);
      expect(publicState.scores).toContainEqual({ id: 'p1', score: 3 });
      expect(publicState.scores).toContainEqual({ id: 'p2', score: 1 });
    }
  });
});
