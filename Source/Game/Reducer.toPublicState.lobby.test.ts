import { describe, test, expect } from 'vitest';
import { toPublicState } from './PublicState';
import { HostState } from './GameState';

describe('toPublicState Lobby state', () => {
  test('converts correctly', () => {
    const state: HostState = {
      phase: 'Lobby',
      players: new Map([['p1', 'Alice'], ['p2', 'Bob']]),
      cumulativeScores: new Map(),
    };
    const publicState = toPublicState(state);
    expect(publicState.phase).toBe('Lobby');
    if (publicState.phase === 'Lobby') {
      // After checking phase, TypeScript should narrow the type to PublicLobbyState
      expect(publicState.players.length).toBe(2);
      expect(publicState.players).toContainEqual({ id: 'p1', name: 'Alice' });
      expect(publicState.players).toContainEqual({ id: 'p2', name: 'Bob' });
    }
  });
});