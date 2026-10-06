import { describe, test, expect } from 'vitest';
import { toPublicState } from './PublicState';
import { HostState } from './GameState';

describe('toPublicState Final state', () => {
  test('converts correctly', () => {
    const state: HostState = {
      phase: 'Final',
      players: new Map(),
      cumulativeScores: new Map([['p1', 10], ['p2', 5]]),
      turnPlayerId: null,
    };
    const publicState = toPublicState(state);
    expect(publicState.phase).toBe('Final');
    if (publicState.phase === 'Final') {
      // After checking phase, TypeScript should narrow the type to PublicFinalState
      expect(publicState.durationMs).toBe(0);
      expect(publicState.scores.length).toBe(2);
      expect(publicState.scores).toContainEqual({ id: 'p1', score: 10 });
      expect(publicState.scores).toContainEqual({ id: 'p2', score: 5 });
    }
  });
});
