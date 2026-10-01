/**
 * The cast of characters a player can be drawn as, and the tints they can wear.
 *
 * These live in Core because they are shared vocabulary: Design renders them,
 * Game stores them in the roster, and Network carries them. Nothing here knows
 * how a character is drawn, only which ones exist.
 */
export const CharacterIds = [
  'Butterfly',
  'Explosion',
  'Daisy',
  'Ghost',
  'Mask',
  'Hat',
  'Heart',
  'Star',
] as const;

export type CharacterId = (typeof CharacterIds)[number];

export const CharacterColors = [
  'Coral',
  'Amber',
  'Yellow',
  'Lime',
  'Mint',
  'Sky',
  'Violet',
  'Rose',
] as const;

export type CharacterColor = (typeof CharacterColors)[number];

/** How a player looks: which character, in which tint. */
export interface PlayerLook {
  character: CharacterId;
  color: CharacterColor;
}

/**
 * Pick a random look, so every player lands on a different face.
 *
 * The randomness is injected rather than reached for, so the choice is testable
 * and this module stays free of ambient state.
 */
export function randomLook(random: () => number): PlayerLook {
  const character = CharacterIds[Math.floor(random() * CharacterIds.length)];
  const color = CharacterColors[Math.floor(random() * CharacterColors.length)];
  if (character === undefined || color === undefined) {
    throw new Error('Character catalogue is empty');
  }
  return { character, color };
}

export function isCharacterId(value: unknown): value is CharacterId {
  return typeof value === 'string' && CharacterIds.some((id) => id === value);
}

export function isCharacterColor(value: unknown): value is CharacterColor {
  return (
    typeof value === 'string' &&
    CharacterColors.some((color) => color === value)
  );
}

/** Type guard for a look arriving from the network. */
export function isPlayerLook(value: unknown): value is PlayerLook {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  if (!('character' in value) || !('color' in value)) {
    return false;
  }
  return isCharacterId(value.character) && isCharacterColor(value.color);
}
