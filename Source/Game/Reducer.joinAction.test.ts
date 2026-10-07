import { describe, test, expect } from 'vitest';
import { PlayerLook } from '@/Core';
import { reducer } from './Reducer';
import { HostState } from './GameState';

const look: PlayerLook = { character: 'Butterfly', color: 'Coral' };
const otherLook: PlayerLook = { character: 'Ghost', color: 'Sky' };

describe('reducer JOIN action', () => {
  test('adds player', () => {
    let state: HostState = {
      phase: 'Lobby',
      players: new Map(),
      cumulativeScores: new Map(),
      turnPlayerId: null,
      pace: 'Standard',
      themeRounds: new Map(),
    };
    state = reducer(state, { type: 'JOIN', playerId: 'p1', name: 'Alice', look });
    state = reducer(state, { type: 'JOIN', playerId: 'p2', name: 'Bob', look: otherLook });
    if (state.phase === 'Lobby') {
      // After checking phase, TypeScript should narrow the type to LobbyState
      expect(state.players.size).toBe(2);
      expect(state.players.get('p1')?.name).toBe('Alice');
      expect(state.players.get('p2')?.name).toBe('Bob');
      // Each player keeps their own character, so two faces never collide.
      expect(state.players.get('p1')?.look).toEqual(look);
      expect(state.players.get('p2')?.look).toEqual(otherLook);
    }
  });
});

describe('reducer SET_LOOK action', () => {
  const lobby: HostState = {
    phase: 'Lobby',
    players: new Map([['p1', { name: 'Alice', look, isOnline: true }]]),
    cumulativeScores: new Map(),
    turnPlayerId: null,
    pace: 'Standard',
    themeRounds: new Map(),
  };

  test('changes the character in the lobby', () => {
    const state = reducer(lobby, { type: 'SET_LOOK', playerId: 'p1', look: otherLook });
    expect(state.phase === 'Lobby' && state.players.get('p1')?.look).toEqual(otherLook);
  });

  test('keeps the name when the character changes', () => {
    const state = reducer(lobby, { type: 'SET_LOOK', playerId: 'p1', look: otherLook });
    expect(state.phase === 'Lobby' && state.players.get('p1')?.name).toBe('Alice');
  });

  test('ignores a change from a player who is not in the room', () => {
    const state = reducer(lobby, { type: 'SET_LOOK', playerId: 'nobody', look: otherLook });
    expect(state).toBe(lobby);
  });

  test('freezes the character once writing has started', () => {
    const writing: HostState = {
      phase: 'Writing',
      topic: 'Test',
      durationMs: 60_000,
      startedAt: 0,
      answers: new Map(),
      players: new Map(),
      cumulativeScores: new Map(),
      turnPlayerId: null,
      pace: 'Standard',
      themeRounds: new Map(),
      theme: undefined,
    };
    const state = reducer(writing, { type: 'SET_LOOK', playerId: 'p1', look: otherLook });
    // The roster is not carried into Writing, so the change is dropped and the
    // faces everyone saw in the lobby are the faces that play the game.
    expect(state).toBe(writing);
  });
});
