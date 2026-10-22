import { describe, test, expect } from 'vitest';
import { toPublicState } from './PublicState';
import { HostState } from './GameState';

describe('toPublicState Winning state', () => {
  test('converts correctly', () => {
    const state: HostState = {
      phase: 'Winning',
      players: new Map(),
      cumulativeScores: new Map([
        ['p1', 10],
        ['p2', 5],
      ]),
      turnPlayerId: null,
      pace: 'Standard',
      themes: [],
      themeMode: 'Random',
      themeRounds: new Map(),

      paused: false,

      pausedAt: undefined,
      durationMs: 8200,
      startedAt: 1000,
      scores: new Map(),
      theme: undefined,
    };
    const publicState = toPublicState(state);
    expect(publicState.phase).toBe('Winning');
    if (publicState.phase === 'Winning') {
      // After checking phase, TypeScript should narrow the type to PublicWinningState
      expect(publicState.durationMs).toBe(8200);
      expect(publicState.scores.length).toBe(2);
      expect(publicState.scores).toContainEqual({ id: 'p1', score: 10 });
      expect(publicState.scores).toContainEqual({ id: 'p2', score: 5 });
    }
  });
});
