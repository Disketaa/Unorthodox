import { describe, it, expect } from 'vitest';
import { reducer } from './Reducer';
import { scoreRound, speedShareOf } from './RoundScoring';
import type { ReviewingState } from './GameState';
import type { PlayerLook } from '@/Core';

const look: PlayerLook = { character: 'Ghost', color: 'Sky' };

/** The seats in every room below: two who answered, and three who sat the round out and are here
 * only to like. A like is the one thing a player who wrote nothing can still do, so the room
 * that measures likes needs somebody in it who did not answer. */
const ANSWERED = ['early', 'late'];
/** The writing clock this round ran on, which the moments in these cases are read against. */
const Clock = 20_000;
const BYSTANDERS = ['b1', 'b2', 'b3'];

/** One round's board: two unique answers, and the moment each reached the host. Turned into the
 * share of the clock the round keeps, since that is what the round is scored from and the
 * moments are only a way of saying it here. */
function reviewing(times: Record<string, number>, mult?: number): ReviewingState {
  const shares = Object.fromEntries(Object.entries(times).map(([id, at]) => [id, at / Clock]));
  return {
    phase: 'Reviewing',
    players: new Map(
      [...ANSWERED, ...BYSTANDERS].map((id) => [id, { name: id, look, isOnline: true }])
    ),
    cumulativeScores: new Map(),
    turnPlayerId: null,
    pace: 'Standard',
    themes: [],
    themeMode: 'Random',
    themeRounds: new Map(),
    paused: false,
    pausedAt: undefined,
    topic: 'a topic',
    durationMs: Clock,
    startedAt: 0,
    answers: new Map([
      ['early', 'Кот'],
      ['late', 'Дом'],
    ]),
    answerShares: new Map(Object.entries(shares)),
    groupRejections: new Map(),
    groupLikes: new Map(),
    theme: undefined,
    ...(mult === undefined ? {} : { mult }),
  };
}

function roundOf(state: ReviewingState): Map<string, number> {
  return new Map([...scoreRound(state).roundScores].map(([id, score]) => [id, score]));
}

/** One seat's points, or a failure rather than a number nobody scored. A map lookup that can be
 * empty is a map lookup this file would otherwise have to guard at every use. */
function pointsOf(scores: ReadonlyMap<string, number>, playerId: string): number {
  const score = scores.get(playerId);
  if (score === undefined) throw new Error(`nobody scored ${playerId}`);
  return score;
}

/** The room pressing the like on a card, once per player. A second press from the same seat
 * takes the like back, so a count is cast by as many distinct seats as there are likes. */
function liked(state: ReviewingState, groupId: number, ...likers: string[]): ReviewingState {
  let next = state;
  for (const playerId of likers) {
    const pressed = reducer(next, { type: 'LIKE_GROUP', playerId, groupId });
    if (pressed.phase !== 'Reviewing') throw new Error('left reviewing');
    next = pressed;
  }
  return next;
}

describe('speedShareOf', () => {
  it('reads the share the answer was measured at when it arrived', () => {
    const state = reviewing({ early: 0, late: 10_000 });
    expect(speedShareOf(state, 'early')).toBe(0);
    expect(speedShareOf(state, 'late')).toBe(0.5);
  });

  it('reads a player with no share as sent on the first tick', () => {
    // The direction of this default matters: the other way round quietly takes a player's points
    // away for a room that merely cannot say when the answer came.
    expect(speedShareOf(reviewing({ early: 0 }), 'late')).toBe(0);
  });

  it('is the same whatever phase the round is being read in', () => {
    // The share was measured against the writing clock while that clock was the one running. Read
    // against a later phase's own clock, every answer in the round sits before that phase began —
    // and a share below zero clamps to nothing spent, which is the fastest answer there is, so a
    // board counted that way paid every card the full scale however late it was written.
    const shares = reviewing({ early: 0, late: 19_000 }).answerShares;
    expect(speedShareOf(reviewing({ early: 0, late: 19_000 }), 'late')).toBe(0.95);
    // The counts phase carries the same shares the writing clock measured, and its own much later
    // start does not enter into it.
    const counted: ReviewingState = {
      ...reviewing({ early: 0, late: 19_000 }),
      startedAt: 10_000_000,
      durationMs: 15_000,
    };
    expect(counted.answerShares).toEqual(shares);
    expect(speedShareOf(counted, 'late')).toBe(0.95);
  });
});

describe('scoreRound', () => {
  it('pays the answer that came first more than the one that came last', () => {
    const scores = roundOf(reviewing({ early: 0, late: 15_000 }));
    expect(pointsOf(scores, 'early')).toBe(20);
    expect(pointsOf(scores, 'late')).toBe(3);
  });

  it('scores a round nobody liked exactly as it scores it with no likes at all', () => {
    // The case that matters for the board: a like is something the room does, and a room that does
    // none of it must not be quietly moved by the feature that counts them.
    const plain = reviewing({ early: 0, late: 15_000 });
    expect(roundOf(liked(plain, 0))).toEqual(roundOf(plain));
  });

  it('pays one point a like, so the most liked answer is the highest paid', () => {
    const state = reviewing({ early: 0, late: 0 });
    expect(pointsOf(roundOf(liked(state, 0, 'b1')), 'early')).toBe(21);
    expect(pointsOf(roundOf(liked(state, 0, 'b1', 'b2')), 'early')).toBe(22);
    expect(pointsOf(roundOf(liked(state, 0, 'b1', 'b2', 'b3')), 'early')).toBe(23);
  });

  it('multiplies the speed and leaves the likes where they were', () => {
    const plain = roundOf(reviewing({ early: 0, late: 0 }));
    const doubled = roundOf(reviewing({ early: 0, late: 0 }, 2));
    expect(pointsOf(doubled, 'late')).toBe(pointsOf(plain, 'late') * 2);
    // Forty from the doubled speed, and the like still worth the one point it always was.
    expect(
      pointsOf(roundOf(liked(reviewing({ early: 0, late: 0 }, 2), 0, 'b1')), 'early')
    ).toBe(41);
  });

  it('carries the totals forward from the rounds before it', () => {
    const withHistory: ReviewingState = {
      ...reviewing({ early: 0, late: 0 }),
      cumulativeScores: new Map([['early', 100]]),
    };
    expect(pointsOf(scoreRound(withHistory).cumulativeScores, 'early')).toBe(120);
  });

  it('settles the same figure the room watched climb', () => {
    // The bar shows a running total while the round is open and the Scores screen shows it after.
    // Two numbers for one round would be the one thing a player could catch the game at.
    const state = liked(reviewing({ early: 0, late: 15_000 }), 0, 'b1', 'b2');
    const settled = scoreRound(state).cumulativeScores;
    expect(pointsOf(settled, 'early')).toBe(pointsOf(roundOf(state), 'early'));
  });
});
