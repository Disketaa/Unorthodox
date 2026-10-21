import { describe, it, expect } from 'vitest';
import {
  readScores,
  glintedSeats,
  seatPulses,
  struckWriters,
  type BarBoard,
} from './PlayerBarView';
import type { PublicState } from '@/Game';
import type { RevealState } from '../Hooks/UseReveal';

const everyoneNamed: RevealState = {
  moment: 0,
  upTo: 1,
  shownAt: () => 0,
  authorsAt: () => true,
  writerDelayAt: (writer) => writer * 100,
  landedAt: (_index, total) => total,
  likesAt: () => true,
};
const nobodyNamed: RevealState = {
  moment: 0,
  upTo: 0,
  shownAt: () => 0,
  authorsAt: () => false,
  writerDelayAt: () => 0,
  landedAt: () => 0,
  likesAt: () => false,
};

/** Every group the round has declined, shared answers included, as the wire really carries it: a
 * thing more than one player wrote is off the board before the host has pressed anything. */
function declinedIds(muted: number[]): number[] {
  return [...new Set([...muted, 1])];
}

/** One reviewing room: three answers, the second of them written by two people, and a blank. */
function boardOf(muted: number[]): BarBoard {
  return {
    groups: [
      { groupId: 0, text: 'кот', playerCount: 1, playerIds: ['p1'], isEmpty: false },
      { groupId: 1, text: 'дом', playerCount: 2, playerIds: ['p2', 'p3'], isEmpty: false },
      { groupId: 2, text: '', playerCount: 1, playerIds: ['p4'], isEmpty: true },
    ],
    mutedGroupIds: declinedIds(muted),
    pace: 'Standard',
  };
}

function struckOf(muted: number[], reveal: RevealState): Set<string> {
  return struckWriters(boardOf(muted), new Set(declinedIds(muted)), reveal);
}

describe('the bar reacting to the board', () => {
  it('reacts for nobody before the room has been told anything', () => {
    // Nothing has been named and nothing is muted, so there is no news for a seat to carry.
    expect(seatPulses(boardOf([]), nobodyNamed).size).toBe(0);
  });

  it('reacts once each for the writers of every answer the room has been told', () => {
    const pulses = seatPulses(boardOf([]), everyoneNamed);
    expect(pulses.get('p1')).toBe(1);
    expect(pulses.get('p2')).toBe(1);
    expect(pulses.get('p3')).toBe(1);
  });

  it('counts a seat of somebody who wrote nothing, since a blank is a card too', () => {
    expect(seatPulses(boardOf([]), everyoneNamed).get('p4')).toBe(1);
  });

  it('has nothing to say in any phase but the review', () => {
    expect(seatPulses(undefined, everyoneNamed).size).toBe(0);
  });
});

describe('the bar taking players off as their faces land', () => {
  it('takes nobody off before the first face has arrived', () => {
    expect(struckOf([], nobodyNamed).size).toBe(0);
  });

  it('takes them off one at a time, as each face lands', () => {
    // The shared card goes seat by seat: one face down and only the blank is off the bar, two and
    // both its seats go together. A whole card's worth at the same moment is a row of broken seats
    // the room cannot read one at a time.
    const oneFace: RevealState = { ...everyoneNamed, landedAt: () => 1 };
    expect([...struckOf([], oneFace)]).toEqual(['p4']);
    const twoFaces: RevealState = { ...everyoneNamed, landedAt: () => 2 };
    expect([...struckOf([], twoFaces)]).toEqual(['p2', 'p3', 'p4']);
  });

  it('leaves a card the host has turned down alone until its face lands', () => {
    expect(struckOf([0], everyoneNamed).has('p1')).toBe(true);
  });

  it('takes nobody off a shared card while it still looks like one answer', () => {
    // The room has been shown one face and no more. A seat broken already would be the bar saying
    // "nobody had this" before the card in the corner has finished saying who did, which is the one
    // beat the round has and the whole reason the card counts its writers up rather than arriving
    // with the answer on it.
    const oneFace: RevealState = {
      ...everyoneNamed,
      landedAt: (_index, total) => Math.min(1, total),
    };
    expect(struckOf([], oneFace).has('p2')).toBe(false);
    expect(struckOf([], oneFace).has('p3')).toBe(false);
    // The blank is not a shared answer: it has nobody to wait for, so its one seat goes at once.
    expect(struckOf([], oneFace).has('p4')).toBe(true);
  });

  it('breaks a seat for a blank, which is the card of somebody who wrote nothing', () => {
    // A blank is one seat and it is named straight away, since there is nobody else to wait for.
    expect(struckOf([], nobodyNamed).has('p4')).toBe(false);
    expect([...struckOf([], everyoneNamed)]).toContain('p4');
  });

  it('leaves a card the round has not turned down alone, however many wrote it', () => {
    // Only the cards the board draws as written off. This used to read off the scoring rule that a
    // card three or more wrote scores nothing, which broke seats the board was still drawing live.
    const threeWriters: RevealState = { ...everyoneNamed, landedAt: () => 3 };
    expect(struckOf([], threeWriters).has('p1')).toBe(false);
  });

  it('has nothing to say in any phase but the review', () => {
    expect(struckWriters(undefined, new Set(), everyoneNamed).size).toBe(0);
  });
});

/** One round's board as the wire carries it, with the running total the host has sent. */
function reviewingRoom(cumulative: { id: string; score: number }[]): PublicState {
  return {
    phase: 'Reviewing',
    topic: 'a topic',
    durationMs: 1000,
    startedAt: 0,
    turnPlayerId: null,
    pace: 'Standard',
    themes: [],
    themeMode: 'Random',
    customThemes: [],
    spent: [],
    paused: false,
    players: [],
    groups: [],
    cumulative,
  };
}

describe('the number a seat shows under the pointer', () => {
  it('shows the round so far while the round is still open', () => {
    // The case that was a zero. A player hovers their own seat to find out where they stand, and a
    // bar that answered zero until the Scores screen was a bar that had nothing to say for a whole
    // phase of the game.
    const scores = readScores(reviewingRoom([{ id: 'p1', score: 47 }]));
    expect(scores.get('p1')).toBe(47);
  });

  it('shows the settled total once the round has been scored', () => {
    const scores = readScores({
      phase: 'Scores',
      topic: 'a topic',
      durationMs: 1000,
      startedAt: 0,
      turnPlayerId: null,
      pace: 'Standard',
      themes: [],
      themeMode: 'Random',
      customThemes: [],
      spent: [],
      paused: false,
      players: [],
      scores: [{ id: 'p1', score: 12 }],
      cumulative: [{ id: 'p1', score: 59 }],
      groups: [],
      settled: true,
    });
    expect(scores.get('p1')).toBe(59);
  });

  it('shows nothing at all before the first round has been scored', () => {
    // A phase with no score in it is not a phase whose score is zero, and the difference is the
    // whole reason the bar can say which of the two it is looking at.
    expect(readScores(reviewingRoom([])).size).toBe(0);
  });
});

/** One room that has just picked a theme, with the enchantment having reached a seat. */
function choosing(): PublicState {
  return {
    phase: 'Choosing',
    durationMs: 1000,
    startedAt: 0,
    turnPlayerId: null,
    pace: 'Standard',
    themes: [],
    themeMode: 'Random',
    customThemes: [],
    spent: [],
    paused: false,
    players: [],
    affectedPlayerIds: ['p1'],
  };
}

describe('the seats the round has enchanted', () => {
  it('says so from the moment the theme is picked, in every phase that carries the list', () => {
    // The bar is on every screen of the round, so the room is told who was enchanted as soon as
    // the theme is rolled: the bar says it from the start, and only the cards wait for the count.
    expect([...glintedSeats(choosing())]).toEqual(['p1']);
    expect([...glintedSeats({ ...reviewingRoom([]), affectedPlayerIds: ['p1'] })]).toEqual([
      'p1',
    ]);
  });

  it('says nothing when the round enchanted nobody', () => {
    expect(glintedSeats(reviewingRoom([])).size).toBe(0);
  });
});
