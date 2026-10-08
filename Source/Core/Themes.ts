import { Accent, Accents } from './Accents';
import { CharacterColor } from './Characters';
import { randomFor } from './Random';

/** The themes a room can be given, as shared vocabulary. Core for the same reason the cast is:
 * Design draws a card for one, Content names them, and the room carries a deal of them. Nothing
 * here knows what a theme asks about — that is the topic bank's business, and it has none yet. */
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

/** The tint each theme washes in, and names itself in. Reused rather than one hue per theme: the
 * palette holds eight tints and there are nine themes. Each is a `CharacterColor` tint, so wash
 * and ink come from `Accents`, already contrast-checked. */
const ThemeAccents: Readonly<Record<ThemeId, CharacterColor>> = {
  VideoGames: 'Violet',
  Nature: 'Lime',
  Internet: 'Sky',
  Food: 'Amber',
  Music: 'Rose',
  Movies: 'Coral',
  Work: 'Yellow',
  Travel: 'Mint',
  Random: 'Violet',
};

/** The accent a theme washes in, by the same key as `ThemeId`. A function rather than a table to
 * index into, so the one thing a caller needs is the whole accent: wash and ink belong
 * together, and a wash without its ink is half an answer. */
export function themeAccent(theme: ThemeId): Accent {
  return Accents[ThemeAccents[theme]];
}

/** The themes one room is offered, rolled from its code. One function rather than each caller
 * dealing for itself: the bank has to be the same six on every screen in the room, and the host
 * needs the same six to pick at random out of. */
export function themesForRoom(roomCode: string, count: number): ThemeId[] {
  return dealThemes(randomFor(roomCode), count);
}

/** The themes one lobby is offered, drawn from the whole set without repetition. A partial
 * shuffle rather than six rolls, since a deal holding the same theme twice is not a choice. The
 * randomness is injected so a deal is reproducible from its seed. */
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
