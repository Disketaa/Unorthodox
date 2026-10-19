import { describe, it, expect } from 'vitest';
import { handleGoToPhase } from './PhaseJumps';
import { reducer } from './Reducer';
import { freshLobbyState } from './GameState';
import { toPublicReviewingState } from './PublicPhases';
import { toPublicScoresState } from './PublicEndgame';
import type { HostState, ReviewingState } from './GameState';
import type { PlayerId, PlayerLook } from '@/Core';

const look: PlayerLook = { character: 'Ghost', color: 'Sky' };

/** A room of `count` players in Reviewing, with the answers written by `answered` of them and
 * the rest having sat the round out. The roster is the whole room either way, which is the
 * point. */
/** The table's own step onward: what the host's clock does to end a phase. Every room reaches
 * the count this way, which is why the count has to keep what the review was holding. */
function stepOnward(from: HostState): HostState {
  return handleGoToPhase(from, {
    type: 'GO_TO_PHASE',
    phase: 'Scores',
    topic: 'a topic',
    durationMs: 15_000,
    startedAt: 5000,
  });
}

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
    themes: [],
    themeMode: 'Random',
    themeRounds: new Map(),
    paused: false,
    pausedAt: undefined,
    topic: 'a topic',
    durationMs: 1000,
    startedAt: 0,
    answers: new Map(answered),
    groupRejections: new Map(),
    groupLikes: new Map(),
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

  it('counts everybody who wrote nothing as one card between them', () => {
    // One card per blank was a board with more cards than there were people to put in it, and a
    // corner of the room spent entirely on faces with nothing behind them. The card still says how
    // many, so the room still learns how many sat the round out.
    const groups = toPublicReviewingState(reviewing(6, threeAnswers)).groups;
    const blanks = groups.filter((group) => group.isEmpty);
    expect(blanks).toHaveLength(1);
    expect(blanks[0].playerCount).toBe(3);
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
      playerIds: ['p1', 'p2'],
      isEmpty: false,
    });
    expect(groups).toContainEqual({
      groupId: expect.any(Number),
      text: 'дом',
      playerCount: 1,
      playerIds: ['p3'],
      isEmpty: false,
    });
  });

  it('says who wrote a card, so the room can be shown their faces', () => {
    // The board already told the room how many agreed on an answer, which is a fact about people
    // with no faces attached. This is the same fact with names on it, and it is what the corner of
    // the card draws once the room has read the sentence.
    const same: readonly [string, string][] = [
      ['p2', 'дом'],
      ['p1', 'кот'],
      ['p3', 'кот'],
    ];
    const groups = toPublicReviewingState(reviewing(3, same)).groups;
    for (const group of groups.filter((card) => !card.isEmpty)) {
      expect(group.playerIds).toHaveLength(group.playerCount);
    }
    expect(groups.find((card) => card.text === 'кот')?.playerIds).toEqual(['p1', 'p3']);
  });

  it('gives a blank the one player it stands for', () => {
    // A blank says somebody sat the round out, and a face beside it says which of them.
    const groups = toPublicReviewingState(reviewing(4, threeAnswers)).groups;
    const blank = groups.find((group) => group.isEmpty);
    expect(blank?.playerIds).toHaveLength(1);
    expect(blank?.playerCount).toBe(1);
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

  // The deal as the wire carries it: the card ids in the order they go out.
  function dealt(state: ReviewingState): number[] {
    return toPublicReviewingState(state).groups.map((group) => group.groupId);
  }

  // A pool of words no two of which the board would fold together, and four letters or fewer so
  // that only exact matches group at all. Eight of these per round, walking the pool, so
  // consecutive rounds really are different rounds rather than the same answers renamed.
  const pool =
    'кот дом чай нос мед сок ухо рот сыр лук суп дым кит зуб окно море соль небо река гора ветер снег лето поле ок да ах ух рыба ключ стол стул свет тень край зной дуб ель пень'.split(
      ' '
    );

  function withRound(round: number): ReviewingState {
    const written = eight.map(([playerId], seat): [string, string] => [
      playerId,
      pool[(round * 5 + seat) % pool.length] ?? '',
    ]);
    return reviewing(8, written);
  }

  // The same thing with two players sitting the round out, so there are blanks among the cards
  // for the deal to put last.
  function withBlanks(round: number): ReviewingState {
    const written = threeAnswers.map(([playerId], seat): [string, string] => [
      playerId,
      pool[(round * 7 + seat) % pool.length] ?? '',
    ]);
    return reviewing(5, written);
  }

  // A room held and then let go, which is the one thing that used to move the deal.
  function heldThen(state: ReviewingState, heldAt: number, resumedAt: number): ReviewingState {
    const held = reducer(state, { type: 'PAUSE', at: heldAt });
    const resumed = reducer(held, { type: 'RESUME', at: resumedAt });
    if (resumed.phase !== 'Reviewing') throw new Error('left reviewing');
    return resumed;
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
      toPublicReviewingState(withBlanks(round)).groups.map((group) => group.isEmpty)
    );
    const firstIsBlank = rounds.filter((order) => order[0] === true);
    expect(firstIsBlank).toHaveLength(0);
    expect(rounds.every((order) => order.indexOf(true) >= 2)).toBe(true);
  });

  it('holds its deal across a hold on the room', () => {
    // The bug this is here for: the deal was seeded off `startedAt`, and letting a held room go
    // shifts that clock by the hold. Every pause and resume therefore re-dealt the board under a
    // room that was in the middle of reading it. The clock is not what the deal is seeded from
    // now, so holding changes nothing.
    const before = dealt(reviewing(8, eight));
    const held = heldThen(reviewing(8, eight), 1000, 9000);
    expect(dealt(held)).toEqual(before);
  });

  it('holds its deal across two holds, which is where it went wrong', () => {
    // Pausing once and letting go once left the clock where the deal expected it, so a single
    // hold passed. Pausing and letting go twice moved it twice, and the board came back in a new
    // order. This is the case that was reported.
    const before = dealt(reviewing(8, eight));
    let state: HostState = reviewing(8, eight);
    for (const at of [1000, 2000, 3000, 4000]) {
      state = reducer(state, { type: 'PAUSE', at });
      state = reducer(state, { type: 'RESUME', at: at + 5000 });
    }
    if (state.phase !== 'Reviewing') throw new Error('left reviewing');
    expect(dealt(state)).toEqual(before);
  });

  it('is not the order the answers arrived in', () => {
    // The roster order is a real order and an obvious one: it hands out seats and says who wrote
    // what, so a board dealt from it says who sat next to whom and when. Counted over enough
    // rounds that a few coincidences would not clear it.
    const roster = [0, 1, 2, 3, 4, 5, 6, 7].join();
    const deals = Array.from({ length: 30 }, (_, round) => dealt(withRound(round)).join());
    expect(deals.filter((order) => order === roster)).toHaveLength(0);
  });

  it('is a different deal next round', () => {
    // Otherwise the shuffle is a fixture rather than a deal: a room that remembers the last
    // round's order learns who wrote what before the cards are turned over.
    const deals = new Set(
      Array.from({ length: 24 }, (_, round) => dealt(withRound(round)).join())
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
    expect(jumpToReviewing(freshLobbyState()).answers.size).toBe(0);
  });
});

describe('the board does not reshuffle when the round is counted', () => {
  it('carries the room likes into the count, since the count is a step along the round', () => {
    // The host's clock ends the review by naming the phase after it, so every room arrives at the
    // count through a jump rather than through the review's own end. Emptying the likes there meant
    // the room arrived with its votes thrown away: each card was painted in its writer's colour for
    // having been liked and the badge held no number, and the points those likes paid were counted
    // as zero — a card the room had voted on, counted as though nobody had voted on it.
    const liked = reducer(reviewing(4, threeAnswers), {
      type: 'LIKE_GROUP',
      playerId: 'p1',
      groupId: 1,
    });
    const counted = toPublicScoresState(stepOnward(liked));
    expect(counted.likeCounts).toEqual([{ groupId: 1, count: 1 }]);
  });

  it('carries the host mutes into the count too, which are the same claim in reverse', () => {
    // A strike-out that vanished the moment the round was counted reads as the host un-muting, and
    // it left the muted card drawn as a live one being paid.
    const muted = reducer(reviewing(4, threeAnswers), {
      type: 'REJECT_GROUP',
      playerId: 'p1',
      groupId: 1,
    });
    const counted = toPublicScoresState(stepOnward(muted));
    // Group 0 is on the list too: two of the three wrote the same word, so the room declined that
    // answer on sight. This is only about group 1, the host's own mute, surviving the step.
    expect(counted.mutedGroupIds).toContain(1);
  });

  it('still carries nothing for a jump that was not out of a round', () => {
    // The case the original rule was written for: there is no round behind this, so there is
    // nothing to carry and a dock step is not a room's vote.
    const lobby = handleGoToPhase(freshLobbyState(), {
      type: 'GO_TO_PHASE',
      phase: 'Scores',
      topic: 'a topic',
      startedAt: 5000,
      durationMs: 15_000,
    });
    expect(lobby.phase).toBe('Scores');
    if (lobby.phase !== 'Scores') throw new Error('not a board');
    expect(lobby.groupLikes.size).toBe(0);
    expect(lobby.groupRejections.size).toBe(0);
  });

  it('keeps the round its own question, whatever the dock stepped with', () => {
    // The board is dealt from the question, so a round shown under a different question is a board
    // dealt again. The dock standing in the middle of a round has no question of its own to offer
    // and rolls one for the round's number — a fresh roll each press — so taking what it handed
    // moved the question over the board and shuffled the cards underneath it, both on the way into
    // the review and on the way into the count.
    const base = reviewing(4, threeAnswers);
    const reading = toPublicReviewingState(base);
    for (const action of [
      { type: 'GO_TO_PHASE', phase: 'Scores', startedAt: 5000, durationMs: 15_000 },
      { type: 'GO_TO_PHASE', phase: 'Reviewing', startedAt: 5000, durationMs: 15_000 },
    ] as const) {
      const jumped = handleGoToPhase(base, {
        ...action,
        topic: 'some other question entirely',
      });
      if (jumped.phase !== 'Scores' && jumped.phase !== 'Reviewing')
        throw new Error('not a board');
      expect(jumped.topic, action.phase).toBe(reading.topic);
      const dealt =
        jumped.phase === 'Scores'
          ? toPublicScoresState(jumped).groups.map((group) => group.groupId)
          : toPublicReviewingState(jumped).groups.map((group) => group.groupId);
      expect(dealt, action.phase).toEqual(reading.groups.map((group) => group.groupId));
    }
  });

  it('deals the same cards in Reviewing and in Scores', () => {
    // The count is the same board looked at once more, so the cards must stay in the places the
    // room already read them in rather than being dealt again.
    const base = reviewing(4, threeAnswers);
    const reviewingOrder = toPublicReviewingState(base).groups.map((group) => group.text);
    const counted: HostState = {
      ...base,
      phase: 'Scores',
      scores: new Map<PlayerId, number>(),
    };
    const scoresOrder = toPublicScoresState(counted).groups.map((group) => group.text);
    expect(scoresOrder).toEqual(reviewingOrder);
  });
});
