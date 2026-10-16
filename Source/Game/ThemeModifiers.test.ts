import { describe, it, expect } from 'vitest';
import { dealThemes, randomFor, type ThemeId } from '@/Core';
import { GameConfig } from './GameConfig';
import { modifiersForRound } from './ThemeModifiers';

const rule = GameConfig.themes.modifiers;
const bank = dealThemes(randomFor('ABCD'), GameConfig.themes.cardsPerLobby);
/** The rooms a deal is not shared between, so a property read over one of them is not a property
 * of a single arrangement. */
const codes = ['ABCD', 'WXYZ', 'QWER', 'ASDF', 'JKLP', 'TYUI', 'GHBN', 'VFRT'];
const keys = (modifiers: ReadonlyMap<ThemeId, readonly string[]>) => [...modifiers.keys()];

describe('what a round puts on the bank', () => {
  it('gives one room the same enchantments on another device in it', () => {
    // The property the whole arrangement rests on: a roll that came from anywhere but the room
    // code would let a client deal a bank the host cannot see.
    const here = modifiersForRound('ABCD', bank, 0);
    const there = modifiersForRound('ABCD', bank, 0);
    expect(keys(here)).toEqual(keys(there));
  });

  it('enchants the same cards again one round later, because the round is part of the seed', () => {
    // Which round it is is the only thing separating one roll from the next. Seeded on it
    // alone, every round of a room would deal the same six cards the same way.
    const differs = codes.filter((code) => {
      const themes = dealThemes(randomFor(code), GameConfig.themes.cardsPerLobby);
      return (
        keys(modifiersForRound(code, themes, 1)).join() !==
        keys(modifiersForRound(code, themes, 2)).join()
      );
    });
    expect(differs.length).toBeGreaterThan(0);
  });

  it('sometimes enchants nothing, so a plain bank is an answer and not a failure', () => {
    const bare = codes.filter((code) => modifiersForRound(code, bank, 0).size === 0);
    expect(bare.length).toBeGreaterThan(0);
  });

  it('never enchants every card, so the bank is still a choice', () => {
    for (const code of codes) {
      for (let round = 0; round < GameConfig.rounds.count; round += 1) {
        expect(modifiersForRound(code, bank, round).size).toBeLessThan(bank.length);
      }
    }
  });

  it('enchants no more cards than a round is allowed to reach', () => {
    for (const code of codes) {
      for (let round = 0; round < GameConfig.rounds.count; round += 1) {
        expect(modifiersForRound(code, bank, round).size).toBeLessThanOrEqual(rule.maxPerRound);
      }
    }
  });

  it('enchants only cards the bank is holding', () => {
    for (const code of codes) {
      for (const [theme, held] of modifiersForRound(code, bank, 0)) {
        expect(bank).toContain(theme);
        expect(held).toContain('Enchanted');
      }
    }
  });

  it('leaves the chance of enchantment under one, so no round is guaranteed', () => {
    expect(rule.chance).toBeGreaterThan(0);
    expect(rule.chance).toBeLessThan(1);
  });

  it('has fewer cards to enchant than the bank holds, at more than one a round', () => {
    // At one a round the enchantment says which theme and nothing else, and at the bank's own
    // size it stops being a mark on some of the cards and becomes the bank.
    expect(rule.maxPerRound).toBeGreaterThan(1);
    expect(rule.maxPerRound).toBeLessThan(GameConfig.themes.cardsPerLobby);
  });
});
