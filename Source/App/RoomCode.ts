import { GameConfig } from '@/Game';

/**
 * Room codes are written in Cyrillic.
 *
 * Letters that look like Latin ones (А, В, Е, К, М, Н, О, Р, С, Т, У, Х) are
 * left out, so a code read out loud over the phone cannot be misheard. Ъ, Ы and
 * Ь are left out too, because they are awkward to pronounce.
 */
const roomAlphabet = 'БГДЖЗИЙЛПФЦЧШЩЭЮЯ';

/** Uppercase a typed code and drop everything that is not a room letter. */export function normalizeRoomCode(value: string): string {
  const upper = value.toUpperCase();
  let result = '';
  for (const character of upper) {
    if (roomAlphabet.includes(character) && result.length < GameConfig.limits.roomCodeLength) {
      result += character;
    }
  }
  return result;
}

export function isValidRoomCode(value: string): boolean {
  return value.length === GameConfig.limits.roomCodeLength;
}

/** Randomness is a parameter so the function stays testable. */
export function createRoomCode(random: () => number = Math.random): string {
  let code = '';
  for (let index = 0; index < GameConfig.limits.roomCodeLength; index++) {
    const position = Math.floor(random() * roomAlphabet.length);
    code += roomAlphabet[position % roomAlphabet.length];
  }
  return code;
}
