import { describe, test, expect } from 'vitest';
import {
  randomLook,
  isCharacterId,
  isCharacterColor,
  isPlayerLook,
  CharacterIds,
  CharacterColors,
} from './Characters';

describe('randomLook', () => {
  test('returns a valid character and color', () => {
    const look = randomLook(() => 0);
    expect(CharacterIds).toContain(look.character);
    expect(CharacterColors).toContain(look.color);
  });

  test('uses the injected random for character', () => {
    // random() returns 0.9 -> floor(0.9 * 9) = 8 -> last character
    const look = randomLook(() => 0.9);
    expect(look.character).toBe(CharacterIds[CharacterIds.length - 1]);
  });

  test('uses the injected random for color', () => {
    // First call for character, second for color
    let calls = 0;
    const look = randomLook(() => {
      calls += 1;
      return calls === 2 ? 0.9 : 0;
    });
    expect(look.color).toBe(CharacterColors[CharacterColors.length - 1]);
  });

  test('throws when catalogue is empty', () => {
    expect(() => randomLook(() => NaN)).toThrow();
  });
});

describe('isCharacterId', () => {
  test('returns true for valid ids', () => {
    for (const id of CharacterIds) expect(isCharacterId(id)).toBe(true);
  });

  test('returns false for invalid values', () => {
    expect(isCharacterId('not-a-character')).toBe(false);
    expect(isCharacterId(42)).toBe(false);
    expect(isCharacterId(null)).toBe(false);
    expect(isCharacterId(undefined)).toBe(false);
  });
});

describe('isCharacterColor', () => {
  test('returns true for valid colors', () => {
    for (const color of CharacterColors) expect(isCharacterColor(color)).toBe(true);
  });

  test('returns false for invalid values', () => {
    expect(isCharacterColor('not-a-color')).toBe(false);
    expect(isCharacterColor(42)).toBe(false);
    expect(isCharacterColor(null)).toBe(false);
    expect(isCharacterColor(undefined)).toBe(false);
  });
});

describe('isPlayerLook', () => {
  test('returns true for valid looks', () => {
    expect(isPlayerLook({ character: 'Ghost', color: 'Yellow' })).toBe(true);
  });

  test('returns false for invalid looks', () => {
    expect(isPlayerLook({ character: 'Bad', color: 'Yellow' })).toBe(false);
    expect(isPlayerLook({ character: 'Ghost', color: 'Bad' })).toBe(false);
    expect(isPlayerLook({ character: 'Ghost' })).toBe(false);
    expect(isPlayerLook(null)).toBe(false);
    expect(isPlayerLook(undefined)).toBe(false);
    expect(isPlayerLook('string')).toBe(false);
    expect(isPlayerLook(42)).toBe(false);
  });
});
