import { describe, it, expect } from 'vitest';
import { createRandom } from './Random';
import {
  RandomThemeId,
  ThemeBanks,
  ThemeIds,
  isThemeId,
  sampleUnique,
  themeAccent,
  themesForRoom,
} from './Themes';

describe('the themes a room is offered', () => {
  it('is every file in the Themes folder, plus the one that is not a file', () => {
    expect(ThemeIds.length).toBeGreaterThan(1);
    expect(ThemeIds).toContain(RandomThemeId);
    for (const theme of ThemeIds.filter((id) => id !== RandomThemeId)) {
      expect(ThemeBanks.get(theme)?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('holds no bank empty, since a round has to be playable from it', () => {
    for (const [theme, questions] of ThemeBanks) {
      expect(questions.length, theme).toBeGreaterThan(0);
    }
  });

  it('sorts the authored ones the same way in every tab, since a deal is rolled off that order', () => {
    const authored = ThemeIds.filter((id) => id !== RandomThemeId);
    const sorted = [...authored].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    expect(authored).toEqual(sorted);
    expect(ThemeIds[ThemeIds.length - 1]).toBe(RandomThemeId);
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

  it('gives a theme that is not a file an accent like any other', () => {
    expect(themeAccent(RandomThemeId).tint).toBeTruthy();
  });

  it('holds an authored question, so a bank really is the file beside it', () => {
    const food = ThemeBanks.get('Еда');
    expect(food?.some((q) => q.includes('Блюдо'))).toBe(true);
  });
});

describe('the Random theme', () => {
  it('is drawn from the rest rather than written twice', () => {
    const union = ThemeBanks.get(RandomThemeId) ?? [];
    const authored = [...ThemeBanks.entries()]
      .filter(([theme]) => theme !== RandomThemeId)
      .flatMap(([, questions]) => questions);
    expect(union.length).toBe(new Set(authored).size);
  });

  it('holds no question twice, however many themes a question appears in', () => {
    const union = ThemeBanks.get(RandomThemeId) ?? [];
    expect(new Set(union).size).toBe(union.length);
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
