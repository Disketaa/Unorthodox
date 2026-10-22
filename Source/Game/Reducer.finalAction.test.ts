import { describe, test, expect } from 'vitest';
import { reducer } from './Reducer';
import { HostState } from './GameState';

describe('reducer FINAL action', () => {
  test('moves the room back to the lobby, keeping cumulative totals', () => {
    const state: HostState = {
      phase: 'Scores',
      topic: 'a topic',
      answers: new Map(),
      groupRejections: new Map(),
      groupLikes: new Map(),
      durationMs: 15000,
      startedAt: 1000,
      scores: new Map([['p1', 3]]),
      players: new Map(),
      cumulativeScores: new Map([
        ['p1', 6],
        ['p2', 2],
      ]),
      turnPlayerId: null,
      pace: 'Standard',
      themes: [],
      themeMode: 'Random',
      themeRounds: new Map(),

      paused: false,

      pausedAt: undefined,
      theme: undefined,
    };
    const next = reducer(state, { type: 'FINAL' });
    // The game is over: the room goes back to where it started, so the host may deal a new one.
    expect(next.phase).toBe('Lobby');
    expect(Array.from(next.cumulativeScores.entries())).toEqual([
      ['p1', 6],
      ['p2', 2],
    ]);
  });
});
