import { describe, it, expect } from 'vitest';
import { createRandom, randomFor, shuffle } from './Random';

describe('createRandom', () => {
  it('gives the same sequence for the same seed', () => {
    // The whole reason the field reports a seed: an arrangement that cannot be
    // rolled again cannot be reported.
    const first = createRandom(1234);
    const second = createRandom(1234);
    const a = Array.from({ length: 20 }, () => first());
    const b = Array.from({ length: 20 }, () => second());
    expect(a).toEqual(b);
  });

  it('gives a different sequence for a different seed', () => {
    const a = Array.from({ length: 20 }, createRandom(1));
    const b = Array.from({ length: 20 }, createRandom(2));
    expect(a).not.toEqual(b);
  });

  it('stays inside the range every caller assumes', () => {
    // Rolls pick an entry with `floor(random() * n)`, so a value of exactly one
    // would read past the end of the list.
    for (let roll = 0; roll < 500; roll += 1) {
      const value = createRandom(roll)();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('does not repeat itself over the short run a field uses', () => {
    // Forty-four marks take ninety-odd values between them, so a generator that
    // sat still would show up as a band of identical marks.
    const values = Array.from({ length: 88 }, createRandom(99));
    expect(new Set(values).size).toBeGreaterThan(44);
  });

  it('does not stay close to its mean', () => {
    const values = Array.from({ length: 500 }, createRandom(7));
    const mean = values.reduce((total, value) => total + value, 0) / values.length;
    expect(mean).toBeGreaterThan(0.4);
    expect(mean).toBeLessThan(0.6);
  });
});

describe('shuffle', () => {
  it('deals the same order to everyone holding the same seed', () => {
    const here = shuffle([1, 2, 3, 4, 5], randomFor('ABCD'));
    const there = shuffle([1, 2, 3, 4, 5], randomFor('ABCD'));
    expect(here).toEqual(there);
  });

  it('deals a different order to a different seed', () => {
    const orders = ['ABCD', 'WXYZ', '1234', 'room', 'round'].map((code) =>
      shuffle([1, 2, 3, 4, 5, 6, 7, 8], randomFor(code))
    );
    const distinct = new Set(orders.map((order) => order.join(',')));
    expect(distinct.size).toBeGreaterThan(3);
  });

  it('keeps everything it was given, once each', () => {
    // A deal that dropped or doubled an entry would quietly lose a player.
    for (let seed = 0; seed < 40; seed += 1) {
      const dealt = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], createRandom(seed));
      expect([...dealt].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    }
  });

  it('does not leave the list as it found it every time', () => {
    // A shuffle that is its own identity is not one. Counted over enough seeds that a handful of
    // coincidences would not clear it, since any one deal can come back unchanged by chance.
    const roster = Array.from({ length: 8 }, (_, index) => index);
    const moved = Array.from({ length: 60 }, (_, seed) =>
      shuffle(roster, createRandom(seed)).some((entry, index) => entry !== roster[index])
    ).filter(Boolean).length;
    expect(moved).toBeGreaterThan(45);
  });

  it('leaves the caller their own order', () => {
    // The caller's array is its roster, read again for the next deal and the one after.
    const roster = [1, 2, 3, 4, 5];
    shuffle(roster, createRandom(3));
    expect(roster).toEqual([1, 2, 3, 4, 5]);
  });

  it('copes with a list too short to reorder', () => {
    expect(shuffle([], createRandom(1))).toEqual([]);
    expect(shuffle([1], createRandom(1))).toEqual([1]);
  });
});
