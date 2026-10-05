import { Accent, Accents } from './Accents';
import { CharacterColor } from './Characters';

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
 * palette holds eight tints and there are nine themes, so a theme that suits another theme's
 * colour takes it. Nothing here is a new colour — each is one of the eight `CharacterColor`
 * tints, so the wash and the ink come from `Accents`, which are already measured for contrast
 * and already on screen as the faces a player is drawn as. The wash rather than the raw tint,
 * because a raw tint behind a name fails contrast in every one of the eight; the ink step of
 * the same accent is what can be read on its wash. */
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

/** The accent a theme washes in, by the same key as `ThemeId`. One function rather than a table
 * callers index into, so the one thing a caller needs is the whole accent — wash and ink
 * together, since a wash without its ink is half an answer and a caller that picked one out of
 * the pair would have to know they belong together. */
export function themeAccent(theme: ThemeId): Accent {
  return Accents[ThemeAccents[theme]];
}

/** The themes one lobby is offered, drawn from the whole set without repetition. A partial
 * shuffle rather than six independent rolls, because a deal that can hold the same theme twice
 * is not a choice — a player would be weighing one card against its own duplicate. The
 * randomness is injected so a lobby's deal can be reproduced from its seed rather than being a
 * thing that happened once. */
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
