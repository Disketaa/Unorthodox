import { describe, test, expect } from 'vitest';
import { reducer } from './Reducer';
import { HostState } from './GameState';

describe('reducer START_GAME action', () => {
  test('transitions to Choosing, which is where a theme is picked', () => {
    let state: HostState = {
      phase: 'Lobby',
      players: new Map([
        ['p1', { name: 'Alice', look: { character: 'Butterfly', color: 'Coral' }, isOnline: true }],
      ]),
      cumulativeScores: new Map(),
      turnPlayerId: null,
      pace: 'Standard',
    };
    state = reducer(state, { type: 'START_GAME', durationMs: 20000, startedAt: 1000 });
    expect(state.phase).toBe('Choosing');
    if (state.phase === 'Choosing') {
      expect(state.durationMs).toBe(20000);
      expect(state.startedAt).toBe(1000);
      // The roster carries out of the lobby: a theme is picked by the people already seated.
      expect(state.players.size).toBe(1);
    }
  });

  test('leaves a lobby with nobody in it alone', () => {
    const state: HostState = {
      phase: 'Lobby',
      players: new Map(),
      cumulativeScores: new Map(),
      turnPlayerId: null,
      pace: 'Standard',
    };
    expect(reducer(state, { type: 'START_GAME', durationMs: 20000, startedAt: 1000 })).toBe(state);
  });
});
