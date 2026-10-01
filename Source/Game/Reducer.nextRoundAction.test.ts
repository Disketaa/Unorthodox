import { describe, test, expect } from 'vitest';
import { reducer } from './Reducer';
import { HostState } from './GameState';

describe('reducer NEXT_ROUND action', () => {
  test('transitions to Writing with new topic', () => {
    let state: HostState = {
      phase: 'Scores',
      durationMs: 30000,
      startedAt: 1000,
      scores: new Map([['p1', 3]]),
      players: new Map(),
      cumulativeScores: new Map(),
    };
    state = reducer(state, { type: 'NEXT_ROUND', topic: 'New Topic', durationMs: 60000, startedAt: 2000 });
    expect(state.phase).toBe('Writing');
    if (state.phase === 'Writing') {
      // After checking phase, TypeScript should narrow the type to WritingState
      expect(state.topic).toBe('New Topic');
      expect(state.durationMs).toBe(60000);
      expect(state.startedAt).toBe(2000);
      expect(state.answers.size).toBe(0);
    }
  });
});