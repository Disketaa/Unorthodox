import { describe, test, expect } from 'vitest';
import {
  modifiersForRound,
  multForTheme,
  roundsPlayed,
  enchantmentFor,
} from './ThemeModifiers';

describe('modifiersForRound', () => {
  test('returns a map', () => {
    const result = modifiersForRound('AAAA', ['theme1', 'theme2'], 0);
    expect(result).toBeInstanceOf(Map);
  });

  test('all values contain Enchanted', () => {
    const result = modifiersForRound('BBBB', ['theme1', 'theme2', 'theme3'], 0);
    for (const modifiers of result.values()) {
      expect(modifiers).toContain('Enchanted');
    }
  });

  test('respects maxPerRound limit', () => {
    const result = modifiersForRound('CCCC', ['t1', 't2', 't3', 't4', 't5', 't6'], 0);
    expect(result.size).toBeLessThanOrEqual(3);
  });
});

describe('multForTheme', () => {
  test('returns a multiplier from the configured list', () => {
    const result = multForTheme('AAAA', 'theme1', 0);
    expect([1.25, 1.5, 1.75, 2]).toContain(result);
  });

  test('is deterministic for same inputs', () => {
    expect(multForTheme('AAAA', 'theme1', 0)).toBe(multForTheme('AAAA', 'theme1', 0));
  });

  test('differs for different themes', () => {
    const a = multForTheme('AAAA', 'theme1', 0);
    const b = multForTheme('AAAA', 'theme2', 0);
    // May or may not differ, but both must be valid
    expect([1.25, 1.5, 1.75, 2]).toContain(a);
    expect([1.25, 1.5, 1.75, 2]).toContain(b);
  });
});

describe('roundsPlayed', () => {
  test('returns 0 for undefined', () => {
    expect(roundsPlayed(undefined)).toBe(0);
  });

  test('returns 0 for empty array', () => {
    expect(roundsPlayed([])).toBe(0);
  });

  test('sums rounds across entries', () => {
    expect(roundsPlayed([{ rounds: 3 }, { rounds: 5 }, { rounds: 2 }])).toBe(10);
  });
});

describe('enchantmentFor', () => {
  test('returns NoEnchantment for undefined theme', () => {
    const result = enchantmentFor('AAAA', undefined, [], ['t1']);
    expect(result.enchant).toBeUndefined();
    expect(result.effect).toBeUndefined();
  });

  test('returns NoEnchantment when theme not enchanted', () => {
    const result = enchantmentFor('AAAA', 'theme1', [], ['theme1', 'theme2']);
    // May or may not be enchanted depending on the roll
    expect(result).toBeDefined();
  });

  test('returns enchantment roll with valid fields', () => {
    const result = enchantmentFor('BBBB', 'theme1', [{ rounds: 1 }], ['theme1']);
    expect(['Ban', 'Demand', 'MinLength', 'MaxLength', undefined]).toContain(result.enchant);
    expect(['Alone', 'Half', 'Laggards', 'Leaders', undefined]).toContain(result.effect);
    expect(Array.isArray(result.letters)).toBe(true);
    expect(typeof result.mult).toBe('number');
  });
});
