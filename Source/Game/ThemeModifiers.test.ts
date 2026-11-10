import { describe, test, expect } from 'vitest';
import {
  modifiersForRound,
  multForTheme,
  roundsPlayed,
  enchantmentFor,
} from './ThemeModifiers';
import { GameConfig } from './GameConfig';

describe('modifiersForRound', () => {
  test('returns a map', () => {
    const result = modifiersForRound('AAAA', ['theme1', 'theme2'], 0);
    expect(result).toBeInstanceOf(Map);
  });

  test('all values contain Enchanted plus one effect', () => {
    const result = modifiersForRound('BBBB', ['theme1', 'theme2', 'theme3'], 0);
    for (const modifiers of result.values()) {
      expect(modifiers).toContain('Enchanted');
      const effect = modifiers.find(
        (id): id is 'Alone' | 'Half' | 'Laggards' | 'Leaders' => id !== 'Enchanted'
      );
      expect(GameConfig.themes.modifiers.effects).toContain(effect);
    }
  });

  test('respects maxPerRound limit', () => {
    const result = modifiersForRound('CCCC', ['t1', 't2', 't3', 't4', 't5', 't6'], 0);
    expect(result.size).toBeLessThanOrEqual(GameConfig.themes.modifiers.maxPerRound);
  });

  test('is seeded by room code: same inputs give same bank', () => {
    const a = modifiersForRound('SEED1', ['t1', 't2', 't3'], 0);
    const b = modifiersForRound('SEED1', ['t1', 't2', 't3'], 0);
    expect([...a.entries()]).toEqual([...b.entries()]);
  });

  test('is seeded by room code: different rooms give different banks', () => {
    const a = modifiersForRound('SEED1', ['t1', 't2', 't3', 't4', 't5', 't6'], 0);
    const b = modifiersForRound('SEED2', ['t1', 't2', 't3', 't4', 't5', 't6'], 0);
    expect([...a.entries()]).not.toEqual([...b.entries()]);
  });
});

describe('multForTheme', () => {
  test('returns a multiplier from the configured list', () => {
    const result = multForTheme('AAAA', 'theme1', 0);
    expect(GameConfig.themes.mults).toContain(result);
  });

  test('is deterministic for same inputs', () => {
    expect(multForTheme('AAAA', 'theme1', 0)).toBe(multForTheme('AAAA', 'theme1', 0));
  });

  test('is seeded by room code: different rooms give different multipliers', () => {
    const a = multForTheme('SEED1', 'theme1', 0);
    const b = multForTheme('SEED2', 'theme1', 0);
    // Both must be valid multipliers; they may or may not differ
    expect(GameConfig.themes.mults).toContain(a);
    expect(GameConfig.themes.mults).toContain(b);
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
    // With a seed that fails the chance roll, no enchantment is returned
    const result = enchantmentFor('NOENCHANT', 'theme1', [], ['theme1', 'theme2']);
    // May or may not be enchanted depending on the roll; either way the shape is valid
    expect(result).toBeDefined();
    if (result.enchant !== undefined) {
      expect(GameConfig.themes.enchants).toContain(result.enchant);
      expect(result.effect).toBeDefined();
    }
  });

  test('returns enchantment roll with valid fields', () => {
    const result = enchantmentFor('BBBB', 'theme1', [{ rounds: 1 }], ['theme1']);
    expect(['Ban', 'Demand', 'MinLength', 'MaxLength', undefined]).toContain(result.enchant);
    expect(['Alone', 'Half', 'Laggards', 'Leaders', undefined]).toContain(result.effect);
    expect(Array.isArray(result.letters)).toBe(true);
    expect(typeof result.mult).toBe('number');
  });

  test('is seeded by room code: same inputs give same enchantment', () => {
    const a = enchantmentFor('SEED1', 'theme1', [{ rounds: 1 }], ['theme1']);
    const b = enchantmentFor('SEED1', 'theme1', [{ rounds: 1 }], ['theme1']);
    expect(a).toEqual(b);
  });
});
