/**
 * The themes a room can be given, as shared vocabulary.
 *
 * Core for the same reason the cast is: Design draws a card for one, Content names
 * them, and the room carries a deal of them. Nothing here knows what a theme asks
 * about — that is the topic bank's business, and it has none yet.
 */
export const ThemeIds = [
  'VideoGames',
  'Nature',
  'Internet',
  'Food',
  'Music',
  'Movies',
  'Work',
  'Travel',
  'Random',
] as const;

export type ThemeId = (typeof ThemeIds)[number];

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && ThemeIds.some((id) => id === value);
}

/**
 * The themes one lobby is offered, drawn from the whole set without repetition.
 *
 * A partial shuffle rather than six independent rolls, because a deal that can hold the
 * same theme twice is not a choice — a player would be weighing one card against its
 * own duplicate. The randomness is injected so a lobby's deal can be reproduced from
 * its seed rather than being a thing that happened once.
 */
export function dealThemes(random: () => number, count: number): ThemeId[] {
  const pool = [...ThemeIds];
  const taken = Math.min(Math.max(count, 0), pool.length);
  for (let i = 0; i < taken; i += 1) {
    const swapWith = i + Math.floor(random() * (pool.length - i));
    const held = pool[i];
    const drawn = pool[swapWith];
    if (held === undefined || drawn === undefined) {
      return pool.slice(0, taken);
    }
    pool[i] = drawn;
    pool[swapWith] = held;
  }
  return pool.slice(0, taken);
}
