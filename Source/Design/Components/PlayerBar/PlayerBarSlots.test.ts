import { describe, it, expect } from 'vitest';
import type { PlayerBarEntry } from './PlayerBar';
import { rankedFor, slotsFor } from './PlayerBarSlots';

/** A roster of `count` players, in the order the room holds them, with `scores` over the top. */
function room(count: number, scores: number[] = []): PlayerBarEntry[] {
  const players: PlayerBarEntry[] = [];
  for (let index = 0; index < count; index += 1) {
    players.push({
      id: `p${index}`,
      name: `P${index}`,
      score: scores[index] ?? 0,
      character: 'Butterfly',
      color: 'Coral',
    });
  }
  return players;
}

describe('the standing the bar deals', () => {
  it('puts the most points at the left of the row', () => {
    // The bar is the one place the room watches a player being passed, so the row it draws is the
    // standings rather than the lobby order. Left is most, which is the way every table of points
    // in the game is read.
    expect(rankedFor(room(3, [8, 32, 20])).map((player) => player.id)).toEqual([
      'p1',
      'p2',
      'p0',
    ]);
  });

  it('leaves a room nobody has scored to the order the room holds', () => {
    // Before anything is won, everybody is level, and every one of them is looking for themselves
    // in a row of faces. Reranking a row of zeroes is a bar scrambling for no reason.
    expect(rankedFor(room(4)).map((player) => player.id)).toEqual(['p0', 'p1', 'p2', 'p3']);
  });

  it('leaves players who are level where they already were', () => {
    // Two players on the same points have nothing to pass each other over, and a stable sort says
    // so on its own. A bar that exchanged two level players on every award would be a row nobody
    // could read, and the award that caused it would look like a mistake.
    expect(rankedFor(room(4, [5, 5, 5, 5])).map((player) => player.id)).toEqual([
      'p0',
      'p1',
      'p2',
      'p3',
    ]);
    expect(rankedFor(room(4, [9, 5, 9, 1])).map((player) => player.id)).toEqual([
      'p0',
      'p2',
      'p1',
      'p3',
    ]);
  });

  it('ranks over the whole room, so a player who does not fit is passed all the same', () => {
    // Ranking the seats that fit first would rank a bar over a room that is not on screen: the
    // thirteenth player, dropped off the end, would still be drawn as though nobody had passed them.
    const slots = slotsFor(
      rankedFor(room(13, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 99])),
      null,
      12
    );
    // The player who is suddenly top is drawn, and the one left off the end is the one at the
    // bottom of the standings rather than whoever the room happened to put there first.
    expect(slots[0].id).toBe('p12');
    expect(slots.some((player) => player.id === 'p11')).toBe(false);
  });
});

describe('the seats the bar draws', () => {
  it('draws the whole roster when the room fits the bar', () => {
    const players = room(12);
    expect(slotsFor(players, 'p0', 12)).toEqual(players);
  });

  it("keeps the room's own order, since nothing has been won yet", () => {
    // A face that moves about as the round is scored is a face nobody can find themselves in, so
    // the bar only deals itself into the standings once there is a standing to deal by.
    expect(slotsFor(room(4), 'p2', 12).map((player) => player.id)).toEqual([
      'p0',
      'p1',
      'p2',
      'p3',
    ]);
  });

  it('drops the player at the far end when the room is past what the bar holds', () => {
    expect(slotsFor(room(13), 'p0', 12)).toHaveLength(12);
    expect(slotsFor(room(13), 'p0', 12).some((player) => player.id === 'p12')).toBe(false);
  });

  it('puts the local player in the last seat rather than leaving them out', () => {
    // Somebody has to be the one left out, and it is the player who can find somebody to say so
    // rather than a player who is not looking at the screen.
    const slots = slotsFor(room(13), 'p12', 12);
    expect(slots).toHaveLength(12);
    expect(slots[11].id).toBe('p12');
  });

  it('keeps a local player who was already in the head where the room put them', () => {
    expect(slotsFor(room(13), 'p3', 12)[3].id).toBe('p3');
  });

  it('draws one seat whatever it is told, so an undeclared count cannot empty the bar', () => {
    expect(slotsFor(room(3), 'p0', 0)).toHaveLength(1);
  });

  it('draws every seat when the browser has not joined under an id yet', () => {
    expect(slotsFor(room(13), null, 12)).toHaveLength(12);
  });
});
