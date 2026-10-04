import { GameConfig } from '@/Game';

/**
 * Room codes are four digits.
 *
 * Digits are easier to read out loud and to type on a phone keyboard than letters, and there is
 * nothing to confuse with each other the way letters such as O and 0 are.
 */
const roomAlphabet = '0123456789';

/** Uppercase a typed code and drop everything that is not a room letter. */
export function normalizeRoomCode(value: string): string {
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
