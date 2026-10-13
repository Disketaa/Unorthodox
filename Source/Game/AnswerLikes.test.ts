import { describe, it, expect } from 'vitest';
import { reducer } from './Reducer';
import { toPublicReviewingState } from './PublicPhases';
import type { ReviewingState } from './GameState';
import type { PlayerLook } from '@/Core';

const look: PlayerLook = { character: 'Ghost', color: 'Sky' };

/** A room of three in Reviewing, two of whom wrote the same word. Group 0 is the single answer
 * the host wrote and group 1 is the pair, which is what tells a like on one's own apart from
 * one on somebody else's without either of them looking at the state. */
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

function liked(state: ReviewingState, playerId: string, groupId: number): ReviewingState {
  const next = reducer(state, { type: 'LIKE_GROUP', playerId, groupId });
  if (next.phase !== 'Reviewing') throw new Error('left reviewing');
  return next;
}

function likedGroups(state: ReviewingState, groupId: number): string[] {
  return [...(state.groupLikes.get(groupId) ?? [])];
}

/** The counts the room is sent, by group id. */
function onTheWire(state: ReviewingState): Record<number, number> {
  const counts = toPublicReviewingState(state).likeCounts ?? [];
  return Object.fromEntries(counts.map((entry) => [entry.groupId, entry.count]));
}

describe('liking an answer', () => {
  it('is counted for anybody, unlike a mute', () => {
    // A like is a reaction to what somebody said and not a move in the round, so it is not the
    // host's to keep: a room of players who cannot say they liked something is a room that cannot
    // tell a good round from a bad one.
    expect(likedGroups(liked(reviewing(), 'p1', 0), 0)).toEqual(['p1']);
    expect(likedGroups(liked(liked(reviewing(), 'p1', 0), 'p2', 0), 0)).toEqual(['p1', 'p2']);
  });

  it('is taken back when the same answer is liked again', () => {
    const cast = liked(reviewing(), 'p1', 0);
    expect(likedGroups(liked(cast, 'p1', 0), 0)).toEqual([]);
  });

  it('goes out as a count and never as names', () => {
    // Every client is handed this, so a card that named its likers would be a card that said who
    // read it. Checked on the field itself rather than on the whole projection, since the roster
    // legitimately carries every player id in the room.
    const publicState = toPublicReviewingState(liked(liked(reviewing(), 'p1', 0), 'p2', 0));
    expect(publicState.likeCounts).toEqual([{ groupId: 0, count: 2 }]);
    expect(Object.values(publicState.likeCounts?.[0] ?? {})).toEqual([0, 2]);
  });

  it('says nothing at all while nothing is liked', () => {
    expect(toPublicReviewingState(reviewing()).likeCounts).toBeUndefined();
  });

  it('counts each player once, however often they press it', () => {
    let state = liked(reviewing(), 'p1', 0);
    state = liked(state, 'p1', 0);
    state = liked(state, 'p1', 0);
    expect(onTheWire(state)).toEqual({ 0: 1 });
  });

  it('carries a mute and a like on one card at once', () => {
    // They are different fields because they are different things: a mute takes the answer off the
    // board and a like only counts, and the room is shown a card that is both.
    const muted = reducer(reviewing(), {
      type: 'REJECT_GROUP',
      playerId: 'host',
      groupId: 0,
    });
    if (muted.phase !== 'Reviewing') throw new Error('left reviewing');
    const publicState = toPublicReviewingState(liked(muted, 'p1', 0));
    expect(publicState.mutedGroupIds).toEqual([0]);
    expect(publicState.likeCounts).toEqual([{ groupId: 0, count: 1 }]);
  });
});

describe('a player liking their own answer', () => {
  it('is refused, since the host is the only one who knows', () => {
    // Nobody can be told their own authorship without the room learning it, so the host refuses
    // the like instead and the badge is drawn without a press.
    expect(likedGroups(liked(reviewing(), 'host', 0), 0)).toEqual([]);
    expect(onTheWire(liked(reviewing(), 'host', 0))).toEqual({});
  });

  it('is refused on a duplicate they were half of, not just their own card', () => {
    // The grouping is what put them on this card, so the check is asked of the grouping. A player
    // who wrote a near-miss of somebody else's word cannot tell the two apart on screen, so the
    // host has to answer for the pair rather than for the card each of them remembers.
    expect(likedGroups(liked(reviewing(), 'p1', 1), 1)).toEqual([]);
    expect(likedGroups(liked(reviewing(), 'p2', 1), 1)).toEqual([]);
  });

  it('leaves the room free to like the same card', () => {
    // Only the author is refused, and only for their own group: the same card is somebody else's
    // to like.
    expect(likedGroups(liked(reviewing(), 'p1', 0), 0)).toEqual(['p1']);
  });

  it('starts the next round with nothing liked on it', () => {
    // Group ids are per round, so the same id next round is a different answer and must not
    // arrive carrying the last one's likes. Went through Writing, since that is how a round
    // reaches its board and the only place the likes are cleared.
    const writing = reducer(reviewing(), {
      type: 'START_WRITING',
      topic: 'a topic',
      startedAt: 1000,
      durationMs: 1000,
    });
    const round = reducer(writing, {
      type: 'START_REVIEWING',
      startedAt: 2000,
      durationMs: 1000,
    });
    if (round.phase !== 'Reviewing') throw new Error(`not reviewing: ${round.phase}`);
    expect(round.groupLikes.size).toBe(0);
  });
});
