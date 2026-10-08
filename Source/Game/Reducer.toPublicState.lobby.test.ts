import { describe, test, expect } from 'vitest';
import { toPublicState } from './PublicState';
import { HostState } from './GameState';

const look = { character: 'Butterfly', color: 'Coral' } as const;
const otherLook = { character: 'Hat', color: 'Violet' } as const;

describe('toPublicState Lobby state', () => {
  test('converts correctly', () => {
    const state: HostState = {
      phase: 'Lobby',
      players: new Map([
        ['p1', { name: 'Alice', look, isOnline: true }],
        ['p2', { name: 'Bob', look: otherLook, isOnline: false }],
      ]),
      cumulativeScores: new Map(),
      turnPlayerId: null,
      pace: 'Standard',
      themeRounds: new Map(),

      paused: false,

      pausedAt: undefined,
    };
    const publicState = toPublicState(state);
    expect(publicState.phase).toBe('Lobby');
    if (publicState.phase === 'Lobby') {
      // After checking phase, TypeScript should narrow the type to PublicLobbyState
      expect(publicState.players.length).toBe(2);
      // The look travels to clients, so every player can draw every face, and so does
      // presence, so a client can tell a dropped player from a busy one.
      expect(publicState.players).toContainEqual({
        id: 'p1',
        name: 'Alice',
        look,
        isOnline: true,
      });
      expect(publicState.players).toContainEqual({
        id: 'p2',
        name: 'Bob',
        look: otherLook,
        isOnline: false,
      });
    }
  });
});
