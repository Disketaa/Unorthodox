import { GameConfig } from '@/Game';

/** Room codes skip lookalike letters so they are easy to read out loud. */
const roomAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

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
