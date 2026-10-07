import { describe, test, expect } from 'vitest';
import { toPublicState } from './PublicState';
import { HostState } from './GameState';

describe('toPublicState Writing state', () => {
  test('converts correctly', () => {
    const state: HostState = {
      phase: 'Writing',
      topic: 'Test',
      durationMs: 60000,
      startedAt: 1001,
      answers: new Map([
        ['p1', 'Ans1'],
        ['p2', 'Ans2'],
      ]),
      players: new Map(),
      cumulativeScores: new Map(),
      turnPlayerId: null,
      pace: 'Standard',
      themeRounds: new Map(),
      theme: undefined,
    };
    const publicState = toPublicState(state);
    expect(publicState.phase).toBe('Writing');
    if (publicState.phase === 'Writing') {
      // After checking phase, TypeScript should narrow the type to PublicWritingState
      expect(publicState.topic).toBe('Test');
      expect(publicState.durationMs).toBe(60000);
      expect(publicState.submittedCount).toBe(2);
    }
  });
});
