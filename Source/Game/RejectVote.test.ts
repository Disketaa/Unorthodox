import { describe, it, expect } from 'vitest';
import { reducer } from './Reducer';
import type { ReviewingState } from './GameState';
import type { PlayerLook } from '@/Core';

const look: PlayerLook = { character: 'Ghost', color: 'Sky' };

/** A room of two in Reviewing, with one answer written and nobody having voted on anything. */
function reviewing(): ReviewingState {
  return {
    phase: 'Reviewing',
    players: new Map([
      ['p1', { name: 'One', look, isOnline: true }],
      ['p2', { name: 'Two', look, isOnline: true }],
    ]),
    cumulativeScores: new Map(),
    turnPlayerId: null,
    pace: 'Standard',
    themeRounds: new Map(),
    paused: false,
    pausedAt: undefined,
    topic: 'a topic',
    durationMs: 1000,
    startedAt: 0,
    answers: new Map([['p1', 'нос']]),
    groupRejections: new Map(),
    groupLikes: new Map(),
    theme: undefined,
  };
}

function vote(state: ReviewingState, playerId: string, groupId: number): ReviewingState {
  const next = reducer(state, { type: 'REJECT_GROUP', playerId, groupId });
  if (next.phase !== 'Reviewing') throw new Error('left reviewing');
  return next;
}

/** Who has voted that this group does not fit, in the state the host is holding. */
function voters(state: ReviewingState, groupId: number): string[] {
  return [...(state.groupRejections.get(groupId) ?? [])];
}

describe('a vote on an answer', () => {
  it('is recorded when it is cast', () => {
    expect(voters(vote(reviewing(), 'p1', 0), 0)).toEqual(['p1']);
  });

  it('is taken back when the same answer is voted on again', () => {
    // A player who changed their mind mid-round has to be able to say so, and a vote nobody may
    // take back is a sentence rather than a vote.
    const cast = vote(reviewing(), 'p1', 0);
    expect(voters(vote(cast, 'p1', 0), 0)).toEqual([]);
  });

  it('leaves the room on an answer nobody has taken back', () => {
    let state = vote(reviewing(), 'p1', 0);
    state = vote(state, 'p2', 0);
    state = vote(state, 'p1', 0);
    expect(voters(state, 0)).toEqual(['p2']);
  });

  it('does not rewrite the state the room was last shown', () => {
    // The set held in the old state is the one the room was broadcast from, and voting again
    // must not reach back into it: the host would be scoring a round it has already sent.
    const cast = vote(reviewing(), 'p1', 0);
    vote(cast, 'p1', 0);
    expect(voters(cast, 0)).toEqual(['p1']);
  });

  it('leaves no empty group behind, so the room is not told about one', () => {
    const cast = vote(reviewing(), 'p1', 0);
    expect(vote(cast, 'p1', 0).groupRejections.size).toBe(0);
  });
});
