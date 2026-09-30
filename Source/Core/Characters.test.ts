import { describe, expect, it } from 'vitest';
import {
  CharacterColors,
  CharacterIds,
  isCharacterColor,
  isCharacterId,
} from './Characters';

describe('the cast and the palette', () => {
  /**
   * The picker lays the cast and the palette out as two rows of the same shape, so
   * a ninth tint and nine characters is what keeps the two rows the same control.
   */
  it('has as many tints as there are characters', () => {
    expect(CharacterColors.length).toBe(CharacterIds.length);
  });

  it('has no duplicate tints', () => {
    expect(new Set(CharacterColors).size).toBe(CharacterColors.length);
  });

  it('has no duplicate characters', () => {
    expect(new Set(CharacterIds).size).toBe(CharacterIds.length);
  });

  it('recognises every tint it lists, and nothing else', () => {
    CharacterColors.forEach((color) =>
      expect(isCharacterColor(color)).toBe(true)
    );
    expect(isCharacterColor('Lemonade')).toBe(false);
  });

  it('recognises every character it lists, and nothing else', () => {
    CharacterIds.forEach((id) => expect(isCharacterId(id)).toBe(true));
    expect(isCharacterId('Character0')).toBe(false);
  });
});
