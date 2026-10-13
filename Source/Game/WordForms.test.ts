import { describe, test, expect } from 'vitest';
import { squeezeRuns, stripRussianEndings } from './WordForms';

describe('squeezeRuns', () => {
  test('collapses a held key to one letter', () => {
    expect(squeezeRuns('ннюх')).toBe('нюх');
    expect(squeezeRuns('нююх')).toBe('нюх');
    expect(squeezeRuns('нюююююююююююююююююх')).toBe('нюх');
    expect(squeezeRuns('нюююхххх')).toBe('нюх');
    expect(squeezeRuns('ааааа')).toBe('а');
  });

  test('leaves a word with no run in it alone', () => {
    expect(squeezeRuns('нюх')).toBe('нюх');
    expect(squeezeRuns('привет')).toBe('привет');
    expect(squeezeRuns('')).toBe('');
  });
});

describe('stripRussianEndings', () => {
  test('strips a typical ending off a long enough word', () => {
    expect(stripRussianEndings('приветы')).toBe('привет');
    expect(stripRussianEndings('приветом')).toBe('привет');
    expect(stripRussianEndings('привета')).toBe('привет');
  });

  test('leaves a short stem intact', () => {
    // Four letters or fewer is a word, not a stem with something hanging off it.
    expect(stripRussianEndings('дела')).toBe('дела');
    expect(stripRussianEndings('как')).toBe('как');
    expect(stripRussianEndings('')).toBe('');
  });
});
