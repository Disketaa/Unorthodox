import { describe, test, expect } from 'vitest';
import { effectOf } from './Modifiers';

describe('effectOf', () => {
  test('returns undefined for undefined input', () => {
    expect(effectOf(undefined)).toBeUndefined();
  });

  test('returns undefined for empty array', () => {
    expect(effectOf([])).toBeUndefined();
  });

  test('returns undefined when only Enchanted', () => {
    expect(effectOf(['Enchanted'])).toBeUndefined();
  });

  test('returns Alone when present', () => {
    expect(effectOf(['Enchanted', 'Alone'])).toBe('Alone');
  });

  test('returns Half when present', () => {
    expect(effectOf(['Half'])).toBe('Half');
  });

  test('returns Laggards when present', () => {
    expect(effectOf(['Laggards'])).toBe('Laggards');
  });

  test('returns Leaders when present', () => {
    expect(effectOf(['Leaders'])).toBe('Leaders');
  });

  test('returns first non-Enchanted modifier', () => {
    expect(effectOf(['Enchanted', 'Half', 'Alone'])).toBe('Half');
  });
});
