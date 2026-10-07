import { describe, test, expect } from 'vitest';
import { reducer } from './Reducer';
import { HostState } from './GameState';

describe('reducer FINAL action', () => {
  test('moves Scores to Final keeping cumulative totals', () => {
    const state: HostState = {
      phase: 'Scores',
      durationMs: 15000,
      startedAt: 1000,
      scores: new Map([['p1', 3]]),
      players: new Map(),
      cumulativeScores: new Map([
        ['p1', 6],
        ['p2', 2],
      ]),
      turnPlayerId: null,
      pace: 'Standard',
      themeRounds: new Map(),
      theme: undefined,
    };
    const next = reducer(state, { type: 'FINAL' });
    expect(next.phase).toBe('Final');
    if (next.phase === 'Final') {
      expect(Array.from(next.cumulativeScores.entries())).toEqual([
        ['p1', 6],
        ['p2', 2],
      ]);
    }
  });
});
