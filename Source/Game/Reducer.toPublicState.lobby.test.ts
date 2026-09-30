import { describe, test, expect } from 'vitest';
import { toPublicState } from './PublicState';
import { HostState } from './GameState';

const look = { character: 'Character1', color: 'Coral' } as const;
const otherLook = { character: 'Character7', color: 'Violet' } as const;

describe('toPublicState Lobby state', () => {
  test('converts correctly', () => {
    const state: HostState = {
      phase: 'Lobby',
      players: new Map([
        ['p1', { name: 'Alice', look }],
        ['p2', { name: 'Bob', look: otherLook }],
      ]),
      cumulativeScores: new Map(),
    };
    const publicState = toPublicState(state);
    expect(publicState.phase).toBe('Lobby');
    if (publicState.phase === 'Lobby') {
      // After checking phase, TypeScript should narrow the type to PublicLobbyState
      expect(publicState.players.length).toBe(2);
      // The look travels to clients, so every player can draw every face.
      expect(publicState.players).toContainEqual({ id: 'p1', name: 'Alice', look });
      expect(publicState.players).toContainEqual({ id: 'p2', name: 'Bob', look: otherLook });
    }
  });
});
