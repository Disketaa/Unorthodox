import { describe, it, expect } from 'vitest';
import { createRandom } from './Random';

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