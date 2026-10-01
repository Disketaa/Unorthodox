import { describe, test, expect } from 'vitest';
import { PlayerLook } from '@/Core';
import { reducer } from './Reducer';
import { HostState } from './GameState';
import { toPublicState } from './PublicState';

const look: PlayerLook = { character: 'Butterfly', color: 'Coral' };

function lobby(): HostState {
  return {
    phase: 'Lobby',
    players: new Map([['p1', { name: 'Alice', look, isOnline: true }]]),
    cumulativeScores: new Map(),
    pace: 'Standard',
  };
}

describe('reducer SET_PACE action', () => {
  test('changes the pace the room is set to', () => {
    const state = reducer(lobby(), { type: 'SET_PACE', pace: 'Fast' });
    expect(state.phase === 'Lobby' && state.pace).toBe('Fast');
  });

  test('keeps the roster, since a pace is not a change of seats', () => {
    const state = reducer(lobby(), { type: 'SET_PACE', pace: 'Fast' });
    expect(state.phase === 'Lobby' && state.players.size).toBe(1);
  });

  test('returns the same state when the pace is already that one', () => {
    // A client that pressed the button the room is already on, or a host pressing it
    // twice, should not make the room announce a change that did not happen.
    const state = lobby();
    expect(reducer(state, { type: 'SET_PACE', pace: 'Standard' })).toBe(state);
  });

  test('is ignored once writing has started', () => {
    const writing: HostState = {
      phase: 'Writing',
      topic: 'Test',
      durationMs: 60_000,
      startedAt: 0,
      answers: new Map(),
      cumulativeScores: new Map(),
    };
    expect(reducer(writing, { type: 'SET_PACE', pace: 'Fast' })).toBe(writing);
  });
});

describe('the pace reaches the clients', () => {
  test('is in the public lobby state', () => {
    // The settings card is drawn for clients too, and a card showing one pace while
    // the room plays another is worse than no card at all.
    const publicState = toPublicState(reducer(lobby(), { type: 'SET_PACE', pace: 'Fast' }));
    expect(publicState.phase === 'Lobby' && publicState.pace).toBe('Fast');
  });

  test('is the room default before anybody has chosen', () => {
    const publicState = toPublicState(lobby());
    expect(publicState.phase === 'Lobby' && publicState.pace).toBe('Standard');
  });
});
