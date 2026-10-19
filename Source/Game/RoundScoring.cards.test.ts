import { describe, it, expect } from 'vitest';
import { PlayerLook } from '@/Core';
import { boardCardCount } from './RoundScoring';
import type { BoardState } from './GameState';

const look: PlayerLook = { character: 'Butterfly', color: 'Coral' };

/** A board with these players, this many of whom answered, and one shared answer among the
 * written ones. The shape is what the board is drawn in, which is what the count walks. */
function board(playerIds: readonly string[], answers: Record<string, string>): BoardState {
  return {
    topic: 'a topic',
    durationMs: 90_000,
    startedAt: 1000,
    answers: new Map(Object.entries(answers)),
    groupRejections: new Map(),
    groupLikes: new Map(),
    players: new Map(playerIds.map((id) => [id, { name: id, look, isOnline: true }])),
    cumulativeScores: new Map(),
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

describe('how many cards the count has to walk', () => {
  it('counts a shared answer once, since it is one card and is paid once', () => {
    // Three people who said the same thing are one card on the board, so the count has one turn to
    // spend on them. Counting the players here would open a phase a third longer than the
    // animation needs, and a round that drags is a round the room is watching the clock for.
    const state = board(['p1', 'p2', 'p3'], { p1: 'да', p2: 'да', p3: 'other' });
    expect(boardCardCount(state)).toBe(2);
  });

  it('counts everybody who wrote nothing as one card between them', () => {
    // The same rule the board is drawn by, and it is not "one card each": a room of six where one
    // person sat out has six cards, not seven, and a phase opened for seven would leave the room
    // waiting on a card that is not there.
    const answers = { p1: 'a', p2: 'b' };
    const wroteNone = board(['p1', 'p2', 'p3', 'p4', 'p5', 'p6'], answers);
    const allWrote = board(['p1', 'p2'], answers);
    expect(boardCardCount(wroteNone)).toBe(3);
    expect(boardCardCount(allWrote)).toBe(2);
  });

  it('counts nothing when nobody answered, rather than a card for the room', () => {
    const empty = board(['p1', 'p2'], {});
    // One blank card for everybody who wrote nothing: that is a card, and it is paid as one.
    expect(boardCardCount(empty)).toBe(1);
    expect(boardCardCount(board([], {}))).toBe(0);
  });
});
