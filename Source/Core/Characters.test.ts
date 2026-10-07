import { describe, expect, it } from 'vitest';
import { CharacterColors, CharacterIds, isCharacterColor, isCharacterId } from './Characters';

describe('the cast and the palette', () => {
  // The picker lays the cast and the palette out as two rows of the same shape, all eight on
  // one line, so an equal count is what keeps the two grids the same control rather than one of
  // them trailing an empty cell.
  it('has as many tints as there are characters', () => {
    expect(CharacterColors.length).toBe(CharacterIds.length);
  });

  it('fills the single line of eight the picker lays out', () => {
    expect(CharacterIds.length % 8).toBe(0);
    expect(CharacterColors.length % 8).toBe(0);
  });

  it('has no duplicate tints', () => {
    expect(new Set(CharacterColors).size).toBe(CharacterColors.length);
  });

  it('has no duplicate characters', () => {
    expect(new Set(CharacterIds).size).toBe(CharacterIds.length);
  });

  it('recognises every tint it lists, and nothing else', () => {
    CharacterColors.forEach((color) => expect(isCharacterColor(color)).toBe(true));
    expect(isCharacterColor('Crimson')).toBe(false);
  });

  it('recognises every character it lists, and nothing else', () => {
    CharacterIds.forEach((id) => expect(isCharacterId(id)).toBe(true));
    expect(isCharacterId('Squirrel')).toBe(false);
  });
});
