import { describe, test, expect } from 'vitest';
import { toPublicState } from './PublicState';
import { HostState } from './GameState';

describe('toPublicState Scores state', () => {
  test('converts correctly', () => {
    const state: HostState = {
      phase: 'Scores',
      durationMs: 30000,
      startedAt: 1000,
      scores: new Map([
        ['p1', 3],
        ['p2', 1],
      ]),
      players: new Map(),
      cumulativeScores: new Map(),
      turnPlayerId: null,
      pace: 'Standard',
      themeRounds: new Map(),

      paused: false,

      pausedAt: undefined,
      theme: undefined,
    };
    const publicState = toPublicState(state);
    expect(publicState.phase).toBe('Scores');
    if (publicState.phase === 'Scores') {
      // After checking phase, TypeScript should narrow the type to PublicScoresState
      expect(publicState.durationMs).toBe(30000);
      expect(publicState.scores.length).toBe(2);
      expect(publicState.scores).toContainEqual({ id: 'p1', score: 3 });
      expect(publicState.scores).toContainEqual({ id: 'p2', score: 1 });
    }
  });

  test('sends the per-theme round counts on every phase, not only on Choosing', () => {
    // The bank is on screen through all of them, and a card that only drained while the room was
    // choosing would fill back up the moment the round started.
    const state: HostState = {
      phase: 'Scores',
      durationMs: 30000,
      startedAt: 1000,
      scores: new Map(),
      players: new Map(),
      cumulativeScores: new Map(),
      turnPlayerId: null,
      pace: 'Standard',
      themeRounds: new Map([['Nature', 3]]),
      paused: false,
      pausedAt: undefined,
      theme: undefined,
    };
    expect(toPublicState(state).spent).toEqual([{ theme: 'Nature', rounds: 3 }]);
  });
});
