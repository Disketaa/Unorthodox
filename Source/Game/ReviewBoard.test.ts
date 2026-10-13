import { describe, it, expect } from 'vitest';
import { handleGoToPhase } from './PhaseJumps';
import { toPublicReviewingState } from './PublicPhases';
import type { HostState, ReviewingState } from './GameState';
import type { PlayerLook } from '@/Core';

const look: PlayerLook = { character: 'Ghost', color: 'Sky' };

/** A room of `count` players in Reviewing, with the answers written by `answered` of them and
 * the rest having sat the round out. The roster is the whole room either way, which is the
 * point. */
function reviewing(count: number, answered: readonly [string, string][]): ReviewingState {
  const players = new Map(
    Array.from(
      { length: count },
      (_, index) => [`p${index + 1}`, { name: `P${index + 1}`, look, isOnline: true }] as const
    )
  );
  return {
    phase: 'Reviewing',
    players,
    cumulativeScores: new Map(),
    turnPlayerId: null,
    pace: 'Standard',
    themeRounds: new Map(),
    paused: false,
    pausedAt: undefined,
    topic: 'a topic',
    durationMs: 1000,
    startedAt: 0,
    answers: new Map(answered),
    groupRejections: new Map(),
    theme: undefined,
  };
}

const threeAnswers: readonly [string, string][] = [
  ['p1', 'нос'],
  ['p2', 'сыр'],
  ['p3', 'нос'],
];

describe('the board of answers', () => {
  it('gives a player who wrote nothing a card of their own', () => {
    // Jackbox shows the room who sat a round out. A player with no answer is in no group of
    // answers, so without this the room cannot tell a silent player from a missing one. Three
    // answers here collapse to two cards, since two of them matched.
    const groups = toPublicReviewingState(reviewing(4, threeAnswers)).groups;
    expect(groups).toHaveLength(3);
    expect(groups.filter((group) => group.isEmpty)).toHaveLength(1);
  });

  it('marks the card empty and leaves the word to the screen', () => {
    // The game knows only that the card is empty. The sentence on it belongs to `Strings`, which
    // is a layer above this one, so `text` is left blank rather than filled in here.
    const blank = toPublicReviewingState(reviewing(4, threeAnswers)).groups.find(
      (group) => group.isEmpty
    );
    expect(blank?.text).toBe('');
    expect(blank?.playerCount).toBe(1);
  });

  it('counts a card per player who wrote nothing, not one card counting them', () => {
    // One card would say that one player wrote nothing rather than that three did, and a room
    // reading the board would be counting the wrong seats.
    const groups = toPublicReviewingState(reviewing(6, threeAnswers)).groups;
    expect(groups.filter((group) => group.isEmpty)).toHaveLength(3);
  });

  it('deals the answers and puts the blank cards after them', () => {
    // The answers are dealt, so their order says nothing about who wrote what. The blanks are not
    // dealt into that order: a blank is nobody having written rather than an answer to judge, and
    // the room reads the cards it can judge before the cards it can only count.
    const groups = toPublicReviewingState(reviewing(4, threeAnswers)).groups;
    expect(groups.map((group) => group.isEmpty)).toEqual([false, false, true]);
  });

  it('shows no blank at all in a round everybody answered', () => {
    const groups = toPublicReviewingState(reviewing(3, threeAnswers)).groups;
    expect(groups.every((group) => !group.isEmpty)).toBe(true);
  });

  it('gives every card an id of its own, so a vote lands on the answer it was cast for', () => {
    // A repeated id would send a vote on one card to another, which is the one thing a board of
    // cards cannot survive.
    const groups = toPublicReviewingState(reviewing(5, threeAnswers)).groups;
    expect(new Set(groups.map((group) => group.groupId)).size).toBe(groups.length);
  });

  it('does not give a player two cards, having answered and sat out at once', () => {
    const groups = toPublicReviewingState(reviewing(3, threeAnswers)).groups;
    expect(groups.filter((group) => group.isEmpty)).toHaveLength(0);
  });

  it('puts players who wrote the same thing on one card, counting them', () => {
    // The board is scored on duplicates, so a duplicate is one card carrying its count rather
    // than two cards of the same word that the room has to match up by eye.
    const same: readonly [string, string][] = [
      ['p1', 'кот'],
      ['p2', 'кот'],
      ['p3', 'дом'],
    ];
    const groups = toPublicReviewingState(reviewing(3, same)).groups;
    expect(groups).toHaveLength(2);
    // Matched on the count and the word rather than on position: the deal decides which of the
    // two comes first, and what the board is scored on is that they are paired, not which is first.
    expect(groups).toContainEqual({
      groupId: expect.any(Number),
      text: 'кот',
      playerCount: 2,
      isEmpty: false,
    });
    expect(groups).toContainEqual({
      groupId: expect.any(Number),
      text: 'дом',
      playerCount: 1,
      isEmpty: false,
    });
  });

  it('folds an answer onto one already on the board, ignoring how it was written', () => {
    // What the room is shown is one word, and "Кот." is the same word as "кот": two cards of it
    // would ask the room to judge a difference the round is not scored on.
    const same: readonly [string, string][] = [
      ['p1', 'Кот.'],
      ['p2', 'кот'],
    ];
    const groups = toPublicReviewingState(reviewing(2, same)).groups;
    expect(groups).toHaveLength(1);
    expect(groups[0]?.playerCount).toBe(2);
  });
});

describe('the order the cards are dealt in', () => {
  const eight: readonly [string, string][] = [
    ['p1', 'кот'],
    ['p2', 'дом'],
    ['p3', 'чай'],
    ['p4', 'нос'],
    ['p5', 'мед'],
    ['p6', 'сок'],
    ['p7', 'ухо'],
    ['p8', 'рот'],
  ];

  // The deal as the wire carries it: the card ids in the order they go out, which is the only part of it a client sees.
  function dealt(state: ReviewingState): number[] {
    return toPublicReviewingState(state).groups.map((group) => group.groupId);
  }

  it('is the same deal to everyone in the room', () => {
    // Every client is handed the same array, so there is nothing to agree on and nothing that
    // can drift: the host projects it and they all draw it. Counted as ids, since two cards with
    // the same word are still two different cards.
    const state = reviewing(8, eight);
    expect(dealt(state)).toEqual(dealt(reviewing(8, eight)));
  });

  it('holds still while the round is being shown', () => {
    // The state is projected again on every broadcast, and the board is drawn again from it each
    // time. A deal that moved would slide a card out from under a player who had already voted
    // on it, and vote on the same card across two broadcasts.
    const state = reviewing(8, eight);
    const first = dealt(state);
    for (let broadcast = 0; broadcast < 8; broadcast += 1) {
      expect(dealt(state)).toEqual(first);
    }
  });

  it('keeps the blanks last however the answers come out', () => {
    // Counted over enough rounds that a blank landing first by chance would not pass as a rule
    // being held. This is the one order the deal does not touch.
    const rounds = Array.from({ length: 40 }, (_, round) =>
      toPublicReviewingState({ ...reviewing(5, threeAnswers), startedAt: round }).groups.map(
        (group) => group.isEmpty
      )
    );
    const firstIsBlank = rounds.filter((order) => order[0] === true);
    expect(firstIsBlank).toHaveLength(0);
    expect(rounds.every((order) => order.indexOf(true) >= 2)).toBe(true);
  });

  it('is not the order the answers arrived in', () => {
    // The roster order is a real order and an obvious one: it hands out seats and says who wrote
    // what, so a board dealt from it says who sat next to whom and when. Counted over enough
    // rounds that a few coincidences would not clear it.
    const rounds = Array.from({ length: 30 }, (_, round) =>
      dealt({ ...reviewing(8, eight), startedAt: round })
    );
    const inRosterOrder = rounds.filter(
      (order) => order.join() === [0, 1, 2, 3, 4, 5, 6, 7].join()
    );
    expect(inRosterOrder).toHaveLength(0);
  });

  it('is a different deal next round', () => {
    // Otherwise the shuffle is a fixture rather than a deal: a room that remembers the last
    // round's order learns who wrote what before the cards are turned over.
    const deals = new Set(
      Array.from({ length: 24 }, (_, round) =>
        dealt({ ...reviewing(8, eight), startedAt: round }).join()
      )
    );
    expect(deals.size).toBeGreaterThan(12);
  });

  it('keeps a card with its own id, so a vote lands where it was cast', () => {
    // The deal moves the cards and nothing else: the id travels with the answer, which is what a
    // rejection vote is held against. An id reassigned by position would score one player's vote
    // for another player's answer.
    const state = reviewing(8, eight);
    const dealtIds = dealt(state);
    expect(new Set(dealtIds).size).toBe(dealtIds.length);
    expect(toPublicReviewingState(state).groups.every((group) => group.playerCount > 0)).toBe(
      true
    );
    expect([...dealtIds].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('deals a board of two the same way, and a board of one as itself', () => {
    // Short boards have to come out too, and a board of one card cannot be dealt at all.
    const two = reviewing(2, [
      ['p1', 'кот'],
      ['p2', 'дом'],
    ]);
    expect(dealt(two)).toEqual(
      dealt(
        reviewing(2, [
          ['p1', 'кот'],
          ['p2', 'дом'],
        ])
      )
    );
    expect(dealt(reviewing(1, [['p1', 'кот']]))).toEqual([0]);
  });
});

describe('the host’s dock stepping into Reviewing', () => {
  const writing: HostState = {
    ...reviewing(3, threeAnswers),
    phase: 'Writing',
    answers: new Map(threeAnswers),
    editing: new Set(),
  };

  function jumpToReviewing(from: HostState): ReviewingState {
    const state = handleGoToPhase(from, {
      type: 'GO_TO_PHASE',
      phase: 'Reviewing',
      topic: 'a topic',
      durationMs: 1000,
      startedAt: 0,
    });
    if (state.phase !== 'Reviewing') throw new Error('not reviewing');
    return state;
  }

  it('keeps the answers the room had already written', () => {
    // The dock steps the room one phase along. Throwing the round away would show a board of
    // blanks for a round the bots had answered, which is the dock hiding what it just skipped.
    expect([...jumpToReviewing(writing).answers.values()]).toEqual(['нос', 'сыр', 'нос']);
  });

  it('starts empty when the dock stepped here from anywhere but Writing', () => {
    // From the lobby there is no round to carry, and a jump is not a round anybody played.
    expect(jumpToReviewing(reviewing(3, threeAnswers)).answers.size).toBe(0);
  });
});
