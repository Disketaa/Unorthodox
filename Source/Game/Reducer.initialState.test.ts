import { describe, test, expect } from 'vitest';
import { reducer } from './Reducer';

describe('reducer initial state', () => {
  test('is lobby with no players', () => {
    const state = reducer(undefined, { type: 'JOIN', playerId: 'p1', name: 'Alice' });
    expect(state.phase).toBe('Lobby');
    // Access players map in a type-safe way
    if (state.phase === 'Lobby') {
      // After checking phase, TypeScript should narrow the type to LobbyState
      expect(state.players.size).toBe(1);
      expect(state.players.get('p1')).toBe('Alice');
    }
  });
});