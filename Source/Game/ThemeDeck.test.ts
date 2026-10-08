import { describe, it, expect } from 'vitest';
import { RandomThemeId, ThemeBanks } from '@/Core';
import { GameConfig } from './GameConfig';
import { deckFor, questionFor } from './ThemeDeck';

const per = GameConfig.themes.roundsPerTheme;

describe('the questions one room plays in one theme', () => {
  it('deals a full round of them out of every file, since no bank is that short', () => {
    for (const theme of ThemeBanks.keys()) {
      const bank = ThemeBanks.get(theme)?.length ?? 0;
      expect(bank, theme).toBeGreaterThan(per);
      expect(deckFor('WXYZ', theme), theme).toHaveLength(per);
    }
  });

  it('never asks the same question twice in one run of the theme', () => {
    for (const theme of ['Еда', 'Природа', RandomThemeId]) {
      const deck = deckFor('WXYZ', theme);
      expect(new Set(deck).size, theme).toBe(deck.length);
    }
  });

  it('deals the same deck for the same room and theme in every tab', () => {
    expect(deckFor('WXYZ', 'Природа')).toEqual(deckFor('WXYZ', 'Природа'));
    expect(deckFor('ABCD', 'Природа')).not.toEqual(deckFor('WXYZ', 'Природа'));
  });

  it('deals a theme chosen late the same as one chosen early', () => {
    // Dealt per theme rather than per game, so nothing has to be held in state waiting for a
    // theme the room has not reached yet.
    expect(deckFor('WXYZ', 'Путешествия')).toEqual(deckFor('WXYZ', 'Путешествия'));
  });

  it('holds nothing that is not in the theme own bank', () => {
    const bank = ThemeBanks.get('Музыка') ?? [];
    for (const question of deckFor('WXYZ', 'Музыка')) {
      expect(bank).toContain(question);
    }
  });

  it('deals the Random theme from every theme at once', () => {
    const union = new Set(ThemeBanks.get(RandomThemeId));
    for (const question of deckFor('WXYZ', RandomThemeId)) expect(union).toContain(question);
  });
});

describe('the question a round in a theme asks', () => {
  it('takes the deck in order, counting the round being asked as one of them', () => {
    const deck = deckFor('WXYZ', 'Еда');
    expect(questionFor('WXYZ', 'Еда', 1)).toBe(deck[0]);
    expect(questionFor('WXYZ', 'Еда', 2)).toBe(deck[1]);
  });

  it('asks no two rounds the same question', () => {
    const deck = deckFor('WXYZ', 'Еда');
    const asked = deck.map((_, index) => questionFor('WXYZ', 'Еда', index + 1));
    expect(new Set(asked).size).toBe(asked.length);
  });

  it('wraps round rather than running out, since a theme outlives its bank', () => {
    const deck = deckFor('WXYZ', 'Еда');
    expect(questionFor('WXYZ', 'Еда', deck.length + 1)).toBe(deck[0]);
  });

  it('asks the same question in every tab of the room', () => {
    expect(questionFor('WXYZ', 'Природа', 3)).toBe(questionFor('WXYZ', 'Природа', 3));
  });
});
