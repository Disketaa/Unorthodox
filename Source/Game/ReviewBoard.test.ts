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

  it('puts the blank cards last, so they never split a pair of answers', () => {
    // Two answers that matched are one card, and a blank wedged between them would break the row
    // into two cards of the same answer with an empty card between them.
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
    expect(groups[0]).toMatchObject({ text: 'кот', playerCount: 2 });
    expect(groups[1]).toMatchObject({ text: 'дом', playerCount: 1 });
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
