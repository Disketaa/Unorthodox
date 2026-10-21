import { describe, test, expect } from 'vitest';
import { toPublicState } from './PublicState';
import { reducer } from './Reducer';
import { HostState } from './GameState';

/** A room that has counted a round, with the totals it has settled. */
function scored(): HostState {
  return {
    phase: 'Scores',
    topic: 'a topic',
    answers: new Map(),
    groupRejections: new Map(),
    groupLikes: new Map(),
    durationMs: 30000,
    startedAt: 1000,
    scores: new Map([
      ['p1', 3],
      ['p2', 1],
    ]),
    players: new Map(),
    cumulativeScores: new Map([
      ['p1', 9],
      ['p2', 4],
    ]),
    turnPlayerId: null,
    pace: 'Standard',
    themes: [],
    themeMode: 'Random',
    themeRounds: new Map(),
    paused: false,
    pausedAt: undefined,
    theme: 'Nature',
  };
}

describe('the leaderboard phase', () => {
  test('carries the totals the room is standing at', () => {
    // The phase draws the places, and the places are the totals every player has over the rounds
    // so far rather than the round that has just been counted.
    const state: HostState = {
      phase: 'Leaderboard',
      durationMs: 4000,
      startedAt: 2000,
      scores: new Map([['p1', 3]]),
      players: new Map(),
      cumulativeScores: new Map([
        ['p1', 9],
        ['p2', 4],
      ]),
      turnPlayerId: null,
      pace: 'Standard',
      themes: [],
      themeMode: 'Random',
      themeRounds: new Map(),
      affectedPlayers: new Set(),
      paused: false,
      pausedAt: undefined,
      theme: 'Nature',
    };
    const publicState = toPublicState(state);
    expect(publicState.phase).toBe('Leaderboard');
    if (publicState.phase === 'Leaderboard') {
      expect(publicState.durationMs).toBe(4000);
      expect(publicState.scores).toContainEqual({ id: 'p1', score: 9 });
      expect(publicState.scores).toContainEqual({ id: 'p2', score: 4 });
    }
  });

  test('is where the room goes when the count is over', () => {
    // The board is counted card by card and the places are shown once, at the end: a phase of
    // its own, so the room is given a beat to read the order in.
    const state = reducer(scored(), {
      type: 'GO_TO_PHASE',
      phase: 'Leaderboard',
      topic: 'a topic',
      durationMs: 4000,
      startedAt: 2000,
    });
    expect(state.phase).toBe('Leaderboard');
  });

  test('is where the round ends, and the round ends by choosing again', () => {
    // The places are the last thing the room sees of the round, and the next round's theme
    // choice comes after them rather than instead of them.
    const state = reducer(
      reducer(scored(), {
        type: 'GO_TO_PHASE',
        phase: 'Leaderboard',
        topic: 'a topic',
        durationMs: 4000,
        startedAt: 2000,
      }),
      { type: 'NEXT_ROUND', durationMs: 20000, startedAt: 3000 }
    );
    expect(state.phase).toBe('Choosing');
  });
});
