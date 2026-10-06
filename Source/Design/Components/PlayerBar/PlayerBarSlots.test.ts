import { describe, it, expect } from 'vitest';
import type { PlayerBarEntry } from './PlayerBar';
import { slotsFor } from './PlayerBarSlots';

/** A roster of `count` players, in the order the room holds them. */
function room(count: number): PlayerBarEntry[] {
  const players: PlayerBarEntry[] = [];
  for (let index = 0; index < count; index += 1) {
    players.push({
      id: `p${index}`,
      name: `P${index}`,
      score: 0,
      character: 'Butterfly',
      color: 'Coral',
    });
  }
  return players;
}

describe('the seats the bar draws', () => {
  it('draws the whole roster when the room fits the bar', () => {
    const players = room(12);
    expect(slotsFor(players, 'p0', 12)).toEqual(players);
  });

  it('keeps the room\'s own order rather than sorting by anything', () => {
    // A face that moves about as the round is scored is a face nobody can find themselves in,
    // so the bar takes the order the room has held since the lobby.
    expect(slotsFor(room(4), 'p2', 12).map((player) => player.id)).toEqual(['p0', 'p1', 'p2', 'p3']);
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
