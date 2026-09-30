import { describe, it, expect } from 'vitest';
import { createRoomCode, isValidRoomCode, normalizeRoomCode } from './RoomCode';
import { GameConfig } from '@/Game';

describe('Room codes', () => {
  it('generates a code of the configured length', () => {
    const code = createRoomCode();
    expect(code).toHaveLength(GameConfig.limits.roomCodeLength);
    expect(isValidRoomCode(code)).toBe(true);
  });

  it('uses digits only', () => {
    for (let attempt = 0; attempt < 200; attempt++) {
      expect(createRoomCode()).toMatch(/^\d+$/);
    }
  });

  it('is driven by the supplied randomness', () => {
    expect(createRoomCode(() => 0)).toBe('0000');
    expect(createRoomCode(() => 0.999999)).toBe('9999');
  });

  it('rejects codes of the wrong length', () => {
    expect(isValidRoomCode('123')).toBe(false);
    expect(isValidRoomCode('12345')).toBe(false);
    expect(isValidRoomCode('1234')).toBe(true);
  });
});

describe('Typed room codes', () => {
  it('keeps digits and drops everything else', () => {
    expect(normalizeRoomCode('1234')).toBe('1234');
    // A phone keyboard may send letters or punctuation into the field.
    expect(normalizeRoomCode('a1b2c3')).toBe('123');
    expect(normalizeRoomCode('1-2 3!4')).toBe('1234');
    expect(normalizeRoomCode('БГДЖ')).toBe('');
  });

  it('caps the code at the configured length', () => {
    const long = normalizeRoomCode('123456789');
    expect(long).toHaveLength(GameConfig.limits.roomCodeLength);
  });
});
