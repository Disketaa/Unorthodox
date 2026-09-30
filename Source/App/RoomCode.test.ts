import { describe, it, expect } from 'vitest';
import { createRoomCode, isValidRoomCode, normalizeRoomCode } from './RoomCode';
import { GameConfig } from '@/Game';

/** Letters that look like Latin ones and must not appear in a code. */
const lookalikes = 'АВЕКМНОРСТУХ';

describe('Room codes', () => {
  it('generates a code of the configured length', () => {
    const code = createRoomCode();
    expect(code).toHaveLength(GameConfig.limits.roomCodeLength);
    expect(isValidRoomCode(code)).toBe(true);
  });

  it('uses Cyrillic letters only', () => {
    for (let attempt = 0; attempt < 200; attempt++) {
      for (const letter of createRoomCode()) {
        expect(letter).toMatch(/[А-ЯЁ]/);
      }
    }
  });

  it('avoids letters that look like Latin ones', () => {
    for (let attempt = 0; attempt < 200; attempt++) {
      for (const letter of createRoomCode()) {
        expect(lookalikes).not.toContain(letter);
      }
    }
  });

  it('is driven by the supplied randomness', () => {
    expect(createRoomCode(() => 0)).toBe('ББББ');
  });

  it('rejects codes of the wrong length', () => {
    expect(isValidRoomCode('БГД')).toBe(false);
    expect(isValidRoomCode('БГДЖЗ')).toBe(false);
    expect(isValidRoomCode('БГДЖ')).toBe(true);
  });
});

describe('Typed room codes', () => {
  it('normalises a typed code to uppercase Cyrillic', () => {
    expect(normalizeRoomCode('бгд')).toBe('БГД');
    expect(normalizeRoomCode('БГДЖ')).toBe('БГДЖ');
  });

  it('drops letters that are not in the alphabet', () => {
    // Latin lookalikes, digits and excluded letters are all removed.
    expect(normalizeRoomCode('Б1Г')).toBe('БГ');
    expect(normalizeRoomCode('AБBГ')).toBe('БГ');
    expect(normalizeRoomCode('БЪГЬЫ')).toBe('БГ');
  });

  it('caps the code at the configured length', () => {
    const long = normalizeRoomCode('БГДЖЗИЙЛ');
    expect(long).toHaveLength(GameConfig.limits.roomCodeLength);
  });
});
