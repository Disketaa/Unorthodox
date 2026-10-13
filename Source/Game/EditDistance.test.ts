import { describe, test, expect } from 'vitest';
import { editDistance, editsAllowed } from './EditDistance';

describe('editDistance', () => {
  test('counts the edits it takes to turn one word into the other', () => {
    expect(editDistance('нюх', 'нюх')).toBe(0);
    expect(editDistance('нюх', 'ннюх')).toBe(1);
    expect(editDistance('нюх', 'нююх')).toBe(1);
    expect(editDistance('hello', 'hallo')).toBe(1);
    expect(editDistance('', 'abc')).toBe(3);
  });

  test('counts a transposed pair as one edit, since that is what a phone types', () => {
    expect(editDistance('привет', 'привте')).toBe(1);
    expect(editDistance('ab', 'ba')).toBe(1);
  });
});

describe('editsAllowed', () => {
  test('allows nothing below the fuzzy floor, so short words stay distinct', () => {
    // "нюх" and "дота" are one edit apart and are not the same answer.
    expect(editsAllowed(3)).toBe(0);
    expect(editsAllowed(4)).toBe(0);
  });

  test('allows one edit in the middle band and two in the long one', () => {
    expect(editsAllowed(5)).toBe(1);
    expect(editsAllowed(8)).toBe(1);
    expect(editsAllowed(9)).toBe(2);
    expect(editsAllowed(20)).toBe(2);
  });
});
