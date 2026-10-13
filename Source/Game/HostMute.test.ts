import { describe, it, expect } from 'vitest';
import { reducer } from './Reducer';
import { toPublicReviewingState } from './PublicPhases';
import { toScoredGroups } from './RoundScoring';
import type { ReviewingState } from './GameState';
import type { PlayerLook } from '@/Core';

const look: PlayerLook = { character: 'Ghost', color: 'Sky' };

/** A room of three in Reviewing, two of whom wrote the same answer, so the board has a group of
 * two authors and one of a single author to tell a host mute apart on. */
function reviewing(): ReviewingState {
  return {
    phase: 'Reviewing',
    players: new Map([
      ['host', { name: 'Host', look, isOnline: true }],
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
    answers: new Map([
      ['host', 'нос'],
      ['p1', 'кот'],
      ['p2', 'кот'],
    ]),
    groupRejections: new Map(),
    groupLikes: new Map(),
    theme: undefined,
  };
}

function muted(state: ReviewingState, groupId: number): ReviewingState {
  const next = reducer(state, { type: 'REJECT_GROUP', playerId: 'host', groupId });
  if (next.phase !== 'Reviewing') throw new Error('left reviewing');
  return next;
}

/** The ids the host has muted, as the wire carries them to every client. */
function onTheWire(state: ReviewingState): number[] {
  const publicState = toPublicReviewingState(state);
  return publicState.mutedGroupIds ?? [];
}

describe('muting an answer', () => {
  it('is taken by the host and shown to the room as muted', () => {
    // The whole point of it being the host's: a card struck out for everybody, not a private
    // mark. If the mute did not reach the wire it would be a card only the host believes in.
    expect(onTheWire(muted(reviewing(), 0))).toEqual([0]);
  });

  it('is taken back when the same answer is pressed again', () => {
    const cast = muted(reviewing(), 0);
    expect(onTheWire(muted(cast, 0))).toEqual([]);
  });

  it('says nothing at all while no answer is muted', () => {
    // Absent rather than an empty list: a room plays whole rounds without the host muting
    // anything, and a field every client then carries for nothing is a field to forget to clear.
    expect(onTheWire(reviewing())).toEqual([]);
    expect(toPublicReviewingState(reviewing()).mutedGroupIds).toBeUndefined();
  });

  it('is held against the answer and not the position', () => {
    // The board is dealt, so the card at position 0 is not the same answer twice running. The
    // muted id has to pick out the same card it did before, whatever order it went out in.
    const state = muted(reviewing(), 1);
    const publicState = toPublicReviewingState(state);
    const mutedCard = publicState.groups.find((group) => group.groupId === 1);
    expect(mutedCard?.playerCount).toBe(2);
  });

  it('leaves a card nobody muted off the wire alone', () => {
    const state = muted(reviewing(), 0);
    expect(onTheWire(state)).toEqual([0]);
    expect(toPublicReviewingState(state).groups).toHaveLength(2);
  });
});

describe('what a muted answer scores', () => {
  it('scores nothing for the players who wrote it', () => {
    // An answer that has nothing to do with the question is not a wrong answer to argue about
    // and is not scored as one: it is taken off the board and the players who wrote it get
    // nothing for it.
    const group = toScoredGroups(muted(reviewing(), 0))[0];
    expect(group?.isRejected).toBe(true);
  });

  it('takes a group of two off the board as well as a group of one', () => {
    // This is what the old rule could not do. It rejected a group when a majority of its own
    // authors had voted it out, and with only the host muting there is never more than one vote,
    // so a pair could only be muted by mistake.
    const scored = toScoredGroups(muted(reviewing(), 1));
    expect(scored).toEqual([
      { playerIds: ['host'], isRejected: false },
      { playerIds: ['p1', 'p2'], isRejected: true },
    ]);
  });

  it('leaves the rest of the board scoring', () => {
    const scored = toScoredGroups(muted(reviewing(), 1));
    expect(scored.filter((group) => !group.isRejected)).toHaveLength(1);
  });
});
