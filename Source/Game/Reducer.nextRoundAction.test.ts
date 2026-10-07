import { describe, test, expect } from 'vitest';
import { reducer } from './Reducer';
import { HostState } from './GameState';

describe('reducer NEXT_ROUND action', () => {
  test('transitions to Choosing, carrying the totals across untouched', () => {
    let state: HostState = {
      phase: 'Scores',
      durationMs: 30000,
      startedAt: 1000,
      scores: new Map([['p1', 3]]),
      players: new Map([
        [
          'p1',
          { name: 'Alice', look: { character: 'Butterfly', color: 'Coral' }, isOnline: true },
        ],
      ]),
      cumulativeScores: new Map([['p1', 7]]),
      turnPlayerId: 'p1',
      pace: 'Standard',
      theme: undefined,
    };
    state = reducer(state, { type: 'NEXT_ROUND', durationMs: 20000, startedAt: 2000 });
    expect(state.phase).toBe('Choosing');
    if (state.phase === 'Choosing') {
      expect(state.durationMs).toBe(20000);
      expect(state.startedAt).toBe(2000);
      expect(state.cumulativeScores.get('p1')).toBe(7);
      expect(state.turnPlayerId).toBe('p1');
    }
  });

  test('leaves a phase that has not finished a round alone', () => {
    const state: HostState = {
      phase: 'Writing',
      topic: 'A topic',
      durationMs: 60000,
      startedAt: 1000,
      answers: new Map(),
      players: new Map(),
      cumulativeScores: new Map(),
      turnPlayerId: null,
      pace: 'Standard',
      theme: undefined,
    };
    expect(reducer(state, { type: 'NEXT_ROUND', durationMs: 20000, startedAt: 2000 })).toBe(
      state
    );
  });
});
