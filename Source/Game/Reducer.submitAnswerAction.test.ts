import { describe, test, expect } from 'vitest';
import { reducer } from './Reducer';
import { HostState } from './GameState';

describe('reducer SUBMIT_ANSWER action', () => {
  test('adds answer in Writing phase', () => {
    let state: HostState = {
      phase: 'Writing',
      topic: 'Test',
      durationMs: 60000,
      startedAt: 1000,
      answers: new Map(),
      players: new Map(),
      cumulativeScores: new Map(),
    };
    state = reducer(state, { type: 'SUBMIT_ANSWER', playerId: 'p1', text: 'Answer1' });
    if (state.phase === 'Writing') {
      // After checking phase, TypeScript should narrow the type to WritingState
      expect(state.answers.size).toBe(1);
      expect(state.answers.get('p1')).toBe('Answer1');
    }
  });

  test('overwrites previous answer', () => {
    let state: HostState = {
      phase: 'Writing',
      topic: 'Test',
      durationMs: 60000,
      startedAt: 1000,
      answers: new Map([['p1', 'Answer1']]),
      players: new Map(),
      cumulativeScores: new Map(),
    };
    state = reducer(state, { type: 'SUBMIT_ANSWER', playerId: 'p1', text: 'Answer2' });
    if (state.phase === 'Writing') {
      // After checking phase, TypeScript should narrow the type to WritingState
      expect(state.answers.size).toBe(1);
      expect(state.answers.get('p1')).toBe('Answer2');
    }
  });
});