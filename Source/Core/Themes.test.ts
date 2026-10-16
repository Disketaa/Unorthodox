import { describe, it, expect } from 'vitest';
import { createRandom } from './Random';
import {
  LegacyRandomThemeId,
  ThemeBanks,
  ThemeColors,
  ThemeIds,
  isThemeId,
  sampleUnique,
  themeAccent,
  themesForRoom,
} from './Themes';

describe('the themes a room is offered', () => {
  it('is every file in the Themes folder, and nothing else', () => {
    expect(ThemeIds.length).toBeGreaterThan(1);
    for (const theme of ThemeIds) {
      expect(ThemeBanks.get(theme)?.length ?? 0, theme).toBeGreaterThan(0);
    }
  });

  it('holds no bank empty, since a round has to be playable from it', () => {
    for (const [theme, questions] of ThemeBanks) {
      expect(questions.length, theme).toBeGreaterThan(0);
    }
  });

  it('sorts them the same way in every tab, since a deal is rolled off that order', () => {
    const sorted = [...ThemeIds].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    expect(ThemeIds).toEqual(sorted);
  });

  it('has no theme named as a way of taking them at random', () => {
    // A bank drawn from every theme has no questions of its own, only the union of the rest, so
    // it was a ninth card that was never one. `Random` is a mode the lobby offers, not a file.
    expect(ThemeIds).not.toContain(LegacyRandomThemeId);
    expect(isThemeId(LegacyRandomThemeId)).toBe(false);
    expect(ThemeBanks.has(LegacyRandomThemeId)).toBe(false);
  });

  it('answers to its own name and to nothing else', () => {
    expect(isThemeId('Природа')).toBe(true);
    expect(isThemeId('Nature')).toBe(false);
    expect(isThemeId('Кошки')).toBe(false);
    expect(isThemeId(7)).toBe(false);
  });

  it('holds the same six for the same room on every device', () => {
    expect(themesForRoom('WXYZ', 6)).toEqual(themesForRoom('WXYZ', 6));
    expect(new Set(themesForRoom('WXYZ', 6)).size).toBe(6);
  });

  it('gives every theme an accent, from the tint its own file names', () => {
    for (const theme of ThemeIds) {
      expect(ThemeColors.has(theme), theme).toBe(true);
      expect(themeAccent(theme).tint, theme).toBeTruthy();
    }
  });

  it('holds no question twice in any bank, since a room would be asked it twice', () => {
    for (const [theme, questions] of ThemeBanks) {
      expect(new Set(questions).size, theme).toBe(questions.length);
    }
  });
});

describe('taking things without repetition', () => {
  it('takes what was asked for, or the whole pool if it is smaller', () => {
    expect(sampleUnique([1, 2, 3, 4], 3, createRandom(1))).toHaveLength(3);
    expect([...sampleUnique([1, 2], 10, createRandom(1))].sort()).toEqual([1, 2]);
    expect(sampleUnique([1, 2], 0, createRandom(1))).toEqual([]);
  });

  it('never takes the same thing twice, however many rolls it takes', () => {
    const taken = sampleUnique(['a', 'b', 'c', 'd', 'e', 'f'], 6, createRandom(42));
    expect(new Set(taken).size).toBe(6);
    expect(taken.sort()).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  });

  it('takes the same arrangement again from the same seed', () => {
    const pool = ['Еда', 'Музыка', 'Природа', 'Путешествия', 'Работа'];
    expect(sampleUnique(pool, 4, createRandom(9))).toEqual(
      sampleUnique(pool, 4, createRandom(9))
    );
  });

  it('leaves the pool it was given alone, since two callers share one list', () => {
    const pool = [1, 2, 3];
    sampleUnique(pool, 2, createRandom(3));
    expect(pool).toEqual([1, 2, 3]);
  });
});
