import { describe, it, expect } from 'vitest';
import type { PlayerBarEntry } from './PlayerBar';
import { slotsFor } from './PlayerBarSlots';

/** A room of `count` players, in the order the roster holds them. */
function room(count: number): PlayerBarEntry[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `p${index}`,
    name: `Игрок ${index + 1}`,
    character: 'Butterfly',
    color: 'Coral',
    score: index,
  }));
}

const names = (entries: readonly PlayerBarEntry[]) => entries.map((entry) => entry.id);

describe('the players the bar draws', () => {
  it('keeps the roster order, which is the room and not a score order', () => {
    expect(names(slotsFor(room(6), 'p2', 16))).toEqual(['p0', 'p1', 'p2', 'p3', 'p4', 'p5']);
  });

  it('draws everybody while the bar holds them', () => {
    expect(slotsFor(room(16), 'p0', 16)).toHaveLength(16);
    expect(slotsFor(room(15), 'p0', 16)).toHaveLength(15);
  });

  it('puts the local player last in a room past the bar, so they are still on it', () => {
    const slots = slotsFor(room(18), 'p16', 16);
    expect(slots).toHaveLength(16);
    expect(slots[15]?.id).toBe('p16');
  });

  it('drops the last player rather than the local one', () => {
    expect(names(slotsFor(room(18), 'p16', 16)).slice(0, 15)).toEqual([
      'p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8',
      'p9', 'p10', 'p11', 'p12', 'p13', 'p14',
    ]);
  });

  it('does not move the local player when they are already in the room of slots', () => {
    // Appending somebody already there would show them twice and drop a player who
    // fitted, so the roster simply stands.
    const slots = slotsFor(room(18), 'p3', 16);
    expect(names(slots)).toEqual(names(room(16)));
  });

  it('draws the first players of the roster when this browser is not in the room', () => {
    expect(names(slotsFor(room(18), null, 16))).toEqual(names(room(16)));
    expect(names(slotsFor(room(18), 'nobody', 16))).toEqual(names(room(16)));
  });

  it('keeps the roster order for everybody it does draw', () => {
    expect(names(slotsFor(room(20), 'p19', 8))).toEqual([
      'p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p19',
    ]);
  });

  it('never returns nothing, whatever the slot count is asked for', () => {
    expect(slotsFor(room(4), 'p3', 1).map((entry) => entry.id)).toEqual(['p3']);
    expect(slotsFor(room(4), 'p3', 0)).toHaveLength(1);
  });
});