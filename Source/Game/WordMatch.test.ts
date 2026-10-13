import { describe, test, expect } from 'vitest';
import { sameWord, sameWords } from './WordMatch';

describe('sameWord', () => {
  test('matches a word exactly', () => {
    expect(sameWord('нюх', 'нюх')).toBe(true);
    expect(sameWord('2', '2')).toBe(true);
  });

  test('allows the edits the shorter word is entitled to', () => {
    expect(sameWord('привет', 'привте')).toBe(true);
    expect(sameWord('телефон', 'телефен')).toBe(true);
  });

  test('allows nothing below the fuzzy floor', () => {
    // One edit apart, and four letters long: two different answers.
    expect(sameWord('нюх', 'дота')).toBe(false);
    expect(sameWord('дота', 'дото')).toBe(false);
    expect(sameWord('hi', 'ha')).toBe(false);
  });

  test('matches a word with a digit in it only exactly', () => {
    expect(sameWord('дота2', 'дота2')).toBe(true);
    expect(sameWord('дота2', 'дота3')).toBe(false);
  });
});

describe('sameWords', () => {
  test('matches the same words in the same order', () => {
    expect(sameWords(['дота'], ['дота'])).toBe(true);
    expect(sameWords([], [])).toBe(true);
  });

  test('never matches across a different count, however similar the strings look', () => {
    expect(sameWords(['дота'], ['дота', 'два'])).toBe(false);
    expect(sameWords(['дота', 'два'], ['дота'])).toBe(false);
    expect(sameWords(['дота'], [])).toBe(false);
  });

  test('cares about the order the words came in', () => {
    expect(sameWords(['красный', 'дом'], ['дом', 'красный'])).toBe(false);
  });
});
