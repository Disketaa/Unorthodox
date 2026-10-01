import { describe, test, expect } from 'vitest';
import { reducer } from './Reducer';
import { HostState } from './GameState';

describe('reducer START_GAME action', () => {
  test('transitions to Writing', () => {
    let state: HostState = {
      phase: 'Lobby',
      players: new Map([
        ['p1', { name: 'Alice', look: { character: 'Butterfly', color: 'Coral' }, isOnline: true }],
      ]),
      cumulativeScores: new Map(),
    };
    state = reducer(state, { type: 'START_GAME', topic: 'Test', durationMs: 60000, startedAt: 1000 });
    expect(state.phase).toBe('Writing');
    if (state.phase === 'Writing') {
      // After checking phase, TypeScript should narrow the type to WritingState
      expect(state.topic).toBe('Test');
      expect(state.durationMs).toBe(60000);
      expect(state.startedAt).toBe(1000);
      expect(state.answers.size).toBe(0);
    }
  });
});