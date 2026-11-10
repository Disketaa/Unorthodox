import { describe, test, expect } from 'vitest';
import { questionWords, questionRevealMs, revealedWordCount } from './Question';

describe('questionWords', () => {
  test('splits on whitespace', () => {
    expect(questionWords('hello world')).toEqual(['hello', 'world']);
  });

  test('keeps punctuation attached to its word', () => {
    expect(questionWords('what is it?')).toEqual(['what', 'is', 'it?']);
  });

  test('filters empty words from multiple spaces', () => {
    expect(questionWords('a  b   c')).toEqual(['a', 'b', 'c']);
  });

  test('returns empty array for empty string', () => {
    expect(questionWords('')).toEqual([]);
  });

  test('returns empty array for spaces only', () => {
    expect(questionWords('   ')).toEqual([]);
  });
});

describe('questionRevealMs', () => {
  test('computes lead-in plus per-word time plus hold', () => {
    expect(questionRevealMs('hello world')).toBe(1000 + 2 * 210 + 3000);
  });

  test('scales with word count', () => {
    expect(questionRevealMs('one')).toBe(1000 + 1 * 210 + 3000);
    expect(questionRevealMs('one two three')).toBe(1000 + 3 * 210 + 3000);
  });

  test('returns hold only for empty question', () => {
    expect(questionRevealMs('')).toBe(1000 + 0 * 210 + 3000);
  });
});

describe('revealedWordCount', () => {
  test('returns zero before lead-in ends', () => {
    expect(revealedWordCount('hello world', 999)).toBe(0);
  });

  test('returns one word at lead-in boundary', () => {
    expect(revealedWordCount('hello world', 1000)).toBe(1);
  });

  test('advances one word per wordMs', () => {
    expect(revealedWordCount('a b c', 1000 + 210)).toBe(2);
    expect(revealedWordCount('a b c', 1000 + 420)).toBe(3);
  });

  test('caps at total word count', () => {
    expect(revealedWordCount('a b', 1000 + 10000)).toBe(2);
  });

  test('returns zero for empty question', () => {
    expect(revealedWordCount('', 5000)).toBe(0);
  });
});
