import { describe, test, expect } from 'vitest';
import { normalizeAnswer } from './Normalization';

describe('normalizeAnswer', () => {
  test('lowercases and removes punctuation', () => {
    expect(normalizeAnswer('Hello, World!')).toBe('hello world');
    expect(normalizeAnswer('HELLO')).toBe('hello');
    expect(normalizeAnswer('  Hello   World  ')).toBe('hello world');
  });

  test('replaces ё with е', () => {
    expect(normalizeAnswer('Ёжик')).toBe('ежик');
    expect(normalizeAnswer('ё')).toBe('е');
  });

  test('handles mixed punctuation and spaces', () => {
    expect(normalizeAnswer('Привет, как дела?')).toBe('привет как дела');
    expect(normalizeAnswer('Ой!!!')).toBe('ой');
    expect(normalizeAnswer('123 abc!@#')).toBe('123 abc');
  });

  test('returns empty string for input with only punctuation', () => {
    expect(normalizeAnswer('!!!')).toBe('');
    expect(normalizeAnswer('   ')).toBe('');
  });
});
