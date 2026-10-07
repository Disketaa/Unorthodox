import { describe, test, expect } from 'vitest';
import { reducer } from './Reducer';
import { HostState } from './GameState';

describe('reducer REJECT_GROUP action', () => {
  test('adds rejection in Reviewing phase', () => {
    let state: HostState = {
      phase: 'Reviewing',
      topic: 'Test',
      durationMs: 30000,
      startedAt: 1000,
      // Both players gave the same answer, so they are one group.
      answers: new Map([
        ['p1', 'Ans1'],
        ['p2', 'Ans1'],
      ]),
      groupRejections: new Map(),
      players: new Map(),
      cumulativeScores: new Map(),
      turnPlayerId: null,
      pace: 'Standard',
      theme: undefined,
    };
    // We need to know the groupId for the answer. For simplicity, we'll assume the groupId is 0.
    // In reality, the groupId is determined by the grouping algorithm.
    // We'll skip testing the exact groupId and just test that the action is processed.
    state = reducer(state, { type: 'REJECT_GROUP', playerId: 'p1', groupId: 0 });
    if (state.phase === 'Reviewing') {
      // After checking phase, TypeScript should narrow the type to ReviewingState
      expect(state.groupRejections.size).toBe(1);
      const rejectionSet = state.groupRejections.get(0);
      expect(rejectionSet).toBeInstanceOf(Set);
      expect(rejectionSet?.has('p1')).toBe(true);
    }
  });
});
