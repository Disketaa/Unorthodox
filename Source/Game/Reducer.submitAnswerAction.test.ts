import { describe, test, expect } from 'vitest';
import { reducer } from './Reducer';
import { HostState } from './GameState';

describe('reducer SUBMIT_ANSWER action', () => {
  test('adds answer in Writing phase', () => {
    let state: HostState = {
      phase: 'Writing',
      topic: 'Test',
      durationMs: 60000,
      startedAt: 1000,
      answers: new Map(),
      players: new Map(),
      cumulativeScores: new Map(),
      turnPlayerId: null,
      pace: 'Standard',
      themes: [],
      themeMode: 'Random',
      themeRounds: new Map(),

      paused: false,

      pausedAt: undefined,
      theme: undefined,
    };
    state = reducer(state, {
      type: 'SUBMIT_ANSWER',
      playerId: 'p1',
      text: 'Answer1',
      at: 4000,
    });
    if (state.phase === 'Writing') {
      // After checking phase, TypeScript should narrow the type to WritingState
      expect(state.answers.size).toBe(1);
      expect(state.answers.get('p1')).toBe('Answer1');
    }
  });

  test('overwrites previous answer', () => {
    let state: HostState = {
      phase: 'Writing',
      topic: 'Test',
      durationMs: 60000,
      startedAt: 1000,
      answers: new Map([['p1', 'Answer1']]),
      players: new Map(),
      cumulativeScores: new Map(),
      turnPlayerId: null,
      pace: 'Standard',
      themes: [],
      themeMode: 'Random',
      themeRounds: new Map(),

      paused: false,

      pausedAt: undefined,
      theme: undefined,
    };
    state = reducer(state, {
      type: 'SUBMIT_ANSWER',
      playerId: 'p1',
      text: 'Answer2',
      at: 9000,
    });
    if (state.phase === 'Writing') {
      // After checking phase, TypeScript should narrow the type to WritingState
      expect(state.answers.size).toBe(1);
      expect(state.answers.get('p1')).toBe('Answer2');
    }
  });

  test('times an answer against the writing clock, and holds it inside it', () => {
    // The share is taken here, while the writing clock is the clock that is running. Measured later
    // it would be taken against whatever phase the room was in by then — and a phase that begins
    // after the answers were written has every one of them before its own start, which clamps to
    // nothing spent, which is the fastest an answer can be and pays the most.
    let state: HostState = {
      phase: 'Writing',
      topic: 'Test',
      durationMs: 60000,
      startedAt: 1000,
      answers: new Map(),
      players: new Map(),
      cumulativeScores: new Map(),
      turnPlayerId: null,
      pace: 'Standard',
      themes: [],
      themeMode: 'Random',
      themeRounds: new Map(),

      paused: false,

      pausedAt: undefined,
      theme: undefined,
    };
    state = reducer(state, { type: 'SUBMIT_ANSWER', playerId: 'p1', text: 'A', at: 16_000 });
    state = reducer(state, { type: 'SUBMIT_ANSWER', playerId: 'p2', text: 'B', at: 31_000 });
    if (state.phase === 'Writing') {
      expect(state.answerShares?.get('p1')).toBeCloseTo(0.25);
      expect(state.answerShares?.get('p2')).toBeCloseTo(0.5);
    }
  });

  test('holds an answer outside the window at the ends rather than past them', () => {
    // A clock is a range and a number outside it is a clock and an answer that do not agree: a
    // message stamped before the round opened, or one that arrived after it closed, are both
    // times this round never had.
    let state: HostState = {
      phase: 'Writing',
      topic: 'Test',
      durationMs: 60000,
      startedAt: 1000,
      answers: new Map(),
      players: new Map(),
      cumulativeScores: new Map(),
      turnPlayerId: null,
      pace: 'Standard',
      themes: [],
      themeMode: 'Random',
      themeRounds: new Map(),

      paused: false,

      pausedAt: undefined,
      theme: undefined,
    };
    state = reducer(state, { type: 'SUBMIT_ANSWER', playerId: 'early', text: 'A', at: 0 });
    state = reducer(state, {
      type: 'SUBMIT_ANSWER',
      playerId: 'late',
      text: 'B',
      at: 10_000_000,
    });
    if (state.phase === 'Writing') {
      expect(state.answerShares?.get('early')).toBe(0);
      expect(state.answerShares?.get('late')).toBe(1);
    }
  });
});
