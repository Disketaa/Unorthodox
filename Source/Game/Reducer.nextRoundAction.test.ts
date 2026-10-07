import { describe, test, expect } from 'vitest';
import { reducer } from './Reducer';
import { HostState, ScoresState } from './GameState';

describe('reducer NEXT_ROUND action', () => {
  test('transitions to Choosing, carrying the totals across untouched', () => {
    let state: HostState = {
      phase: 'Scores',
      durationMs: 30000,
      startedAt: 1000,
      scores: new Map([['p1', 3]]),
      players: new Map([
        [
          'p1',
          { name: 'Alice', look: { character: 'Butterfly', color: 'Coral' }, isOnline: true },
        ],
      ]),
      cumulativeScores: new Map([['p1', 7]]),
      turnPlayerId: 'p1',
      pace: 'Standard',
      themeRounds: new Map(),
      theme: undefined,
    };
    state = reducer(state, { type: 'NEXT_ROUND', durationMs: 20000, startedAt: 2000 });
    expect(state.phase).toBe('Choosing');
    if (state.phase === 'Choosing') {
      expect(state.durationMs).toBe(20000);
      expect(state.startedAt).toBe(2000);
      expect(state.cumulativeScores.get('p1')).toBe(7);
      expect(state.turnPlayerId).toBe('p1');
    }
  });

  test('leaves a phase that has not finished a round alone', () => {
    const state: HostState = {
      phase: 'Writing',
      topic: 'A topic',
      durationMs: 60000,
      startedAt: 1000,
      answers: new Map(),
      players: new Map(),
      cumulativeScores: new Map(),
      turnPlayerId: null,
      pace: 'Standard',
      themeRounds: new Map(),
      theme: undefined,
    };
    expect(reducer(state, { type: 'NEXT_ROUND', durationMs: 20000, startedAt: 2000 })).toBe(
      state
    );
  });

  test('carries the counts across untouched, since they were spent at the press', () => {
    // A theme is chosen once per round, so counting here as well would drain two of its rounds
    // for one. The next bank opens with the previous round's card already one tick down.
    const next = reducer(scored(), { type: 'NEXT_ROUND', durationMs: 20000, startedAt: 2000 });
    if (next.phase !== 'Choosing') throw new Error('NEXT_ROUND did not reach Choosing');
    expect([...next.themeRounds]).toEqual([
      ['Nature', 2],
      ['Food', 5],
    ]);
    expect(next.theme).toBeUndefined();
  });
});

/** A finished round in Nature, the only state NEXT_ROUND moves on from. */
function scored(): ScoresState {
  return {
    phase: 'Scores',
    durationMs: 30000,
    startedAt: 1000,
    scores: new Map(),
    players: new Map(),
    cumulativeScores: new Map(),
    turnPlayerId: null,
    pace: 'Standard',
    themeRounds: new Map([
      ['Nature', 2],
      ['Food', 5],
    ]),
    theme: 'Nature',
  };
}
