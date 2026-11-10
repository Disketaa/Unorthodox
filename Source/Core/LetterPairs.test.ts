import { describe, test, expect } from 'vitest';
import { draftFits, draftCarries, lettersOf, LetterPairs } from './LetterPairs';

describe('LetterPairs', () => {
  test('has twelve pairs', () => {
    expect(LetterPairs).toHaveLength(12);
  });

  test('has no duplicate ru letters', () => {
    const rus = LetterPairs.map((p) => p.ru);
    expect(new Set(rus)).toHaveLength(rus.length);
  });

  test('has no duplicate en letters', () => {
    const ens = LetterPairs.map((p) => p.en);
    expect(new Set(ens)).toHaveLength(ens.length);
  });
});

describe('draftFits', () => {
  test('returns true when bound is undefined', () => {
    expect(draftFits('anything', undefined)).toBe(true);
  });

  test('returns true when length meets least bound', () => {
    expect(draftFits('hello', { figure: 5, least: true })).toBe(true);
    expect(draftFits('hello world', { figure: 5, least: true })).toBe(true);
  });

  test('returns false when length below least bound', () => {
    expect(draftFits('hi', { figure: 5, least: true })).toBe(false);
  });

  test('returns true when length within max bound', () => {
    expect(draftFits('hi', { figure: 5, least: false })).toBe(true);
    expect(draftFits('hello', { figure: 5, least: false })).toBe(true);
  });

  test('returns false when length exceeds max bound', () => {
    expect(draftFits('hello world', { figure: 5, least: false })).toBe(false);
  });
});

describe('draftCarries', () => {
  test('returns true when required set is empty', () => {
    expect(draftCarries('anything', new Set())).toBe(true);
  });

  test('returns true when draft has any required letter', () => {
    expect(draftCarries('hello', new Set(['H', 'X']))).toBe(true);
  });

  test('returns false when draft has no required letter', () => {
    expect(draftCarries('hello', new Set(['X', 'Z']))).toBe(false);
  });

  test('matches uppercase letters in uppercase draft', () => {
    expect(draftCarries('HELLO', new Set(['H']))).toBe(true);
  });

  test('does not match lowercase letter in uppercase draft', () => {
    expect(draftCarries('HELLO', new Set(['h']))).toBe(false);
  });
});

describe('lettersOf', () => {
  test('returns both ru and en letters for each pair', () => {
    const letters = lettersOf(LetterPairs);
    expect(letters.has('А')).toBe(true);
    expect(letters.has('A')).toBe(true);
    expect(letters.has('Х')).toBe(true);
    expect(letters.has('X')).toBe(true);
  });

  test('returns 24 letters for 12 pairs', () => {
    expect(lettersOf(LetterPairs).size).toBe(24);
  });
});
