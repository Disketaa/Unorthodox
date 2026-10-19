import { describe, it, expect } from 'vitest';
import { readScores, readShownScores, payoutsOf, type BarBoard } from './PlayerBarView';
import type { PublicRoom, PublicState } from '@/Game';

/** One seat's figure, which every standing and every round total below is a row of. */
type Standing = { id: string; score: number };

/** The board as the count walks it: cards already turned over and worth something. */
const board: BarBoard = {
  pace: 'Standard',
  groups: [
    {
      groupId: 1,
      text: 'кот',
      playerCount: 1,
      playerIds: ['p1'],
      isEmpty: false,
      score: { base: 32, mult: 1, likes: 0, total: 32 },
    },
    {
      groupId: 2,
      text: 'дом',
      playerCount: 1,
      playerIds: ['p2'],
      isEmpty: false,
      score: { base: 8, mult: 1, likes: 0, total: 8 },
    },
  ],
};

/** What the bar reads out of one phase: the room as the bar sees it in that phase, carrying what
 * the case needs — its own standing between rounds, the round's totals at the count — and
 * nothing of the round's beyond that. */
function between(
  phase: 'Choosing' | 'Writing' | 'Scores',
  extra: { standings?: Standing[]; cumulative?: Standing[] } = {}
): PublicState {
  const room: PublicRoom = {
    turnPlayerId: null,
    pace: 'Standard',
    themes: [],
    themeMode: 'Random',
    customThemes: [],
    spent: [],
    paused: false,
  };
  if (phase === 'Scores') {
    return {
      ...room,
      ...extra,
      phase: 'Scores',
      topic: 'a topic',
      durationMs: 0,
      startedAt: 0,
      players: [],
      scores: [],
      groups: [],
      settled: true,
      cumulative: extra.cumulative ?? [],
    };
  }
  if (phase === 'Writing') {
    return {
      ...room,
      ...extra,
      phase: 'Writing',
      topic: 'a topic',
      durationMs: 0,
      startedAt: 0,
      players: [],
      submittedCount: 0,
    };
  }
  return { ...room, ...extra, phase: 'Choosing', durationMs: 0, startedAt: 0, players: [] };
}

describe('what the bar reads between rounds', () => {
  it('holds the standings through the phases that carry no round', () => {
    // A bar that could only read its figures while a round was being read or counted went back to
    // zero the moment the round was over, and climbed again from the first card of the next one.
    for (const phase of ['Choosing', 'Writing'] as const) {
      const scores = readScores(
        between(phase, {
          standings: [
            { id: 'p1', score: 42 },
            { id: 'p2', score: 7 },
          ],
        })
      );
      expect(scores.get('p1'), phase).toBe(42);
      expect(scores.get('p2'), phase).toBe(7);
    }
  });

  it('is nothing at all before the first round is settled', () => {
    expect(readScores(between('Choosing')).size).toBe(0);
  });
});

describe('what the bar reads at the edge of the count', () => {
  // The count's own state, with the round's points already in the totals on the wire.
  function counting(): PublicState {
    return between('Scores', {
      cumulative: [
        { id: 'p1', score: 32 },
        { id: 'p2', score: 8 },
      ],
    });
  }

  it('lands the room on its standings once the count is through the whole board', () => {
    // The count walks past the last card rather than stopping on it, so one index past the end is
    // the moment the round is paid in full. Shown, the whole room stands where it actually stands.
    const shown = readShownScores(counting(), board, true, 2);
    expect(shown.get('p1')).toBe(32);
    expect(shown.get('p2')).toBe(8);
  });

  it('shows the round being counted, never a standing below what was already there', () => {
    // The round's points come back out of the totals to find where the room stood before it. A
    // standing is never negative — every point is earned — so anything below that is the round
    // being taken out of a total that had not been given it, which the room saw as everyone in
    // the minus the instant the count ended.
    for (const payingIndex of [-1, 0, 1, 2, 3, undefined]) {
      for (const settled of [true, false]) {
        const shown = readShownScores(counting(), board, settled, payingIndex);
        for (const score of shown.values()) {
          expect(
            score,
            `index ${String(payingIndex)} settled ${settled}`
          ).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });
});

describe('what a seat stands for while the count is on it', () => {
  // Two cards on the board, one seat's card first, and the standings the bar is running to.
  const twoCards: BarBoard = {
    pace: 'Standard',
    groups: [
      {
        groupId: 1,
        text: 'кот',
        playerCount: 1,
        playerIds: ['p1'],
        isEmpty: false,
        score: { base: 8, mult: 1, likes: 0, total: 8 },
      },
      {
        groupId: 2,
        text: 'дом',
        playerCount: 1,
        playerIds: ['p2'],
        isEmpty: false,
        score: { base: 30, mult: 1, likes: 0, total: 30 },
      },
    ],
  };
  const standings = new Map([
    ['p1', 28],
    ['p2', 30],
  ]);

  it('shows nothing while its own card is being counted', () => {
    // The seat says nothing while its card is on the count: the loading mark is the figure, and a
    // number in the hexagon would be a number the room had not been shown arriving. Only once the
    // count is through does its own figure land — first the addition, then the total.
    expect(payoutsOf(twoCards, 0, standings, 'counting', false).get('p1')).toBeUndefined();
    expect(payoutsOf(twoCards, 0, standings, 'added', false).get('p1')).toEqual({
      value: 8,
      added: true,
    });
    expect(payoutsOf(twoCards, 0, standings, 'total', false).get('p1')).toEqual({
      value: 28,
      added: false,
      from: 20,
    });
  });

  it('gives every seat its own sub-phase, with no one waiting for another', () => {
    // One figure per seat is not one moment for the room. While p1's card is being counted, p2's
    // seat is still a face. Once p1's card is counted, p1 shows its addition and p2 is still
    // waiting. Each seat moves through counting → added → total on its own card's beat.
    const counting = payoutsOf(twoCards, 1, standings, 'counting', false);
    expect(counting.get('p1')).toEqual({ value: 28, added: false });
    expect(counting.has('p2')).toBe(false);

    const added = payoutsOf(twoCards, 1, standings, 'added', false);
    expect(added.get('p1')).toEqual({ value: 28, added: false });
    expect(added.get('p2')).toEqual({ value: 30, added: true });

    const total = payoutsOf(twoCards, 1, standings, 'total', false);
    // p1's card was counted earlier — it shows the standing, not the climb.
    expect(total.get('p1')).toEqual({ value: 28, added: false });
    // p2's card is being totalled now — the counter climbs from what p2 had before.
    expect(total.get('p2')).toEqual({ value: 30, added: false, from: 0 });
  });

  it('stands for nothing until the count reaches a seat', () => {
    // Before the count is on a card of theirs, a seat is a face: the round has said nothing about
    // this player yet, and a figure in the hexagon would be a figure out of nowhere.
    expect(payoutsOf(twoCards, -1, standings, 'counting', false).size).toBe(0);
    expect(payoutsOf(twoCards, undefined, standings, 'counting', false).size).toBe(0);
    expect(payoutsOf(undefined, 0, standings, 'counting', false).size).toBe(0);
  });

  it('stands for a card that paid nothing, rather than for nothing at all', () => {
    // A seat the round gave nothing to has not become nothing: it has whatever it had before. Its
    // card is counted as an addition of nothing like any other card, and the moment it has been
    // counted the seat stands for the standing it had — drawn in the error colour, to say this
    // round is not where it came from.
    const blanked: BarBoard = {
      pace: 'Standard',
      groups: [
        {
          groupId: 1,
          text: 'чай',
          playerCount: 1,
          playerIds: ['p3'],
          isEmpty: false,
          score: { base: 0, mult: 1, likes: 0, total: 0 },
        },
      ],
    };
    const p3Totals = new Map([['p3', 20]]);
    expect(payoutsOf(blanked, 0, p3Totals, 'counting', false).has('p3')).toBe(false);
    expect(payoutsOf(blanked, 0, p3Totals, 'added', false).get('p3')).toEqual({
      value: 0,
      added: true,
    });
    // The whole board is counted: the seat stands for its standing.
    expect(payoutsOf(blanked, 1, p3Totals, 'total', true).get('p3')).toEqual({
      value: 20,
      added: false,
    });
  });
});
