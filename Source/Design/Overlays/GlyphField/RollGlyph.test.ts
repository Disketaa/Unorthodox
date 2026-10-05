import { describe, it, expect } from 'vitest';
import { createRandom } from '@/Core';
import { rollGlyphColumn } from './RollGlyph';

describe('rollGlyphColumn', () => {
  it('rolls the same band from the same seed', () => {
    // The shipped seeds are a list of arrangements, so a seed that did not
    // reproduce would leave the list describing fields nobody can get back.
    const first = rollGlyphColumn(createRandom(4242));
    const second = rollGlyphColumn(createRandom(4242));
    expect(second).toEqual(first);
  });

  it('holds one mark per slot, so no slot is empty', () => {
    // The marks are placed into even slots; a missing one is a hole in the band.
    const marks = rollGlyphColumn(createRandom(11));
    expect(marks.length).toBe(44);
    expect(new Set(marks.map((mark) => mark.top)).size).toBeGreaterThan(40);
  });

  it('spreads the slots across the whole band, so the field runs off both screen edges', () => {
    // The band is pulled past the top and bottom of the screen by the overscan,
    // so a slot on the band's own end sits beyond the edge rather than half a
    // step in from it. Half a step in bunches the marks in the visible middle and
    // leaves the top and bottom thinner than the rest.
    const step = 100 / (44 - 1);
    const tops = rollGlyphColumn(createRandom(5)).map((mark) => mark.top);
    expect(Math.min(...tops)).toBeLessThanOrEqual(step * 0.5);
    expect(Math.max(...tops)).toBeGreaterThanOrEqual(100 - step * 0.5);
  });

  it('keeps every mark within a slot step of where its slot put it', () => {
    // Jitter is a share of the step rather than of the band, so at double
    // density it can no longer put a mark several slots from where it belongs.
    const step = 100 / (44 - 1);
    const marks = rollGlyphColumn(createRandom(5));
    marks.forEach((mark, slot) => {
      expect(Math.abs(mark.top - (100 * slot) / (44 - 1))).toBeLessThanOrEqual(step);
    });
  });

  it('uses more than one symbol and more than one tone', () => {
    const marks = rollGlyphColumn(createRandom(77));
    expect(new Set(marks.map((mark) => mark.char)).size).toBeGreaterThan(4);
    expect(new Set(marks.map((mark) => mark.tone)).size).toBeGreaterThan(1);
  });
});
