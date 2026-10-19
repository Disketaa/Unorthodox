import { describe, it, expect } from 'vitest';
import { reducer } from './Reducer';
import type { HostState, ReviewingState } from './GameState';
import { PlayerLook } from '@/Core';

const look: PlayerLook = { character: 'Butterfly', color: 'Coral' };

/** A review with one answer already written and the room waiting on it. */
function reviewing(): ReviewingState {
  return {
    phase: 'Reviewing',
    topic: 'a topic',
    durationMs: 90_000,
    startedAt: 1000,
    answers: new Map([['p1', 'раз']]),
    answerShares: new Map([['p1', 0.1]]),
    groupRejections: new Map(),
    groupLikes: new Map(),
    players: new Map([['p1', { name: 'A', look, isOnline: true }]]),
    cumulativeScores: new Map([['p1', 5]]),
    turnPlayerId: null,
    pace: 'Standard',
    themes: [],
    themeMode: 'Random',
    themeRounds: new Map(),
    paused: false,
    pausedAt: undefined,
    theme: undefined,
  };
}

/** The table's own step onward: what the host's clock does to end a phase. */
function stepOnward(state: HostState): HostState {
  return reducer(state, {
    type: 'GO_TO_PHASE',
    phase: 'Scores',
    topic: 'a topic',
    durationMs: 15_000,
    startedAt: 5000,
  });
}

describe('what the table step into the count settles', () => {
  it('settles the round, since a round enters the count settled however it got there', () => {
    // The host's clock ends a phase by naming the one after it, so Reviewing into Scores is a jump
    // like any other and never goes near END_REVIEWING. Counting only there left every round
    // unscored: the board carried each card's own figure, which let the bar add them up as the
    // count reached them, and the standings behind those figures were empty.
    const scored = stepOnward(reviewing());
    expect(scored.phase).toBe('Scores');
    if (scored.phase !== 'Scores') throw new Error('not counted');
    const round = scored.scores.get('p1') ?? 0;
    expect(round).toBeGreaterThan(0);
    expect(scored.cumulativeScores.get('p1')).toBe(5 + round);
  });

  it('settles the round to the same figure the review would have', () => {
    // Two ways into the count, one figure: a room that had its clock run out and a room whose host
    // pressed skip must not finish a round at two different standings.
    const viaTable = stepOnward(reviewing());
    const viaEnd = reducer(reviewing(), {
      type: 'END_REVIEWING',
      startedAt: 5000,
      durationMs: 15_000,
    });
    if (viaTable.phase !== 'Scores' || viaEnd.phase !== 'Scores')
      throw new Error('not counted');
    expect([...viaTable.cumulativeScores]).toEqual([...viaEnd.cumulativeScores]);
  });

  it('settles the round when the dock steps over the review entirely', () => {
    // The dock can name the count straight after the writing, skipping the reading. Such a jump
    // carries the answers but arrives at a board nobody has read: no verdicts, no likes. It has to
    // be scored anyway, because the board went on showing each card its own figure beside a
    // standing that had never heard of them — and the bar reads a standing as this round's total
    // already taken out of it, so an unsettled round put the room below zero.
    const writing: HostState = {
      ...reviewing(),
      phase: 'Writing',
    };
    const scored = stepOnward(writing);
    if (scored.phase !== 'Scores') throw new Error('not counted');
    const round = scored.scores.get('p1') ?? 0;
    expect(round).toBeGreaterThan(0);
    // And the standing is never below what it was before the round, whatever the board is short of.
    expect(scored.cumulativeScores.get('p1')).toBe(5 + round);
  });

  it('settles nothing for a jump that was not out of a review', () => {
    const lobby: HostState = {
      ...reviewing(),
      phase: 'Lobby',
    };
    const jumped = reducer(lobby, {
      type: 'GO_TO_PHASE',
      phase: 'Scores',
      topic: 'a topic',
      durationMs: 15_000,
      startedAt: 5000,
    });
    expect(jumped.phase).toBe('Scores');
    if (jumped.phase !== 'Scores') throw new Error('not counted');
    expect(jumped.scores.size).toBe(0);
  });
});

/** A board a room can read, so the type of a review is exercised rather than assumed. */
export type { ReviewingState };
