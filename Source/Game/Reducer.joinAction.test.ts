import { describe, test, expect } from 'vitest';
import { reducer } from './Reducer';
import { HostState } from './GameState';

describe('reducer JOIN action', () => {
  test('adds player', () => {
    let state: HostState = {
      phase: 'Lobby',
      players: new Map(),
      cumulativeScores: new Map(),
    };
    state = reducer(state, { type: 'JOIN', playerId: 'p1', name: 'Alice' });
    state = reducer(state, { type: 'JOIN', playerId: 'p2', name: 'Bob' });
    if (state.phase === 'Lobby') {
      // After checking phase, TypeScript should narrow the type to LobbyState
      expect(state.players.size).toBe(2);
      expect(state.players.get('p1')).toBe('Alice');
      expect(state.players.get('p2')).toBe('Bob');
    }
  });
});