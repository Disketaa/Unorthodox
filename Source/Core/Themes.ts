/** The themes a room can be given, as shared vocabulary. Core for the same reason the cast is:
 * Design draws a card for one, Game asks one, and the room carries a deal of them. A theme is a
 * file in `Content/Themes`, one question a line, read here at build time. */
import { Accent, Accents } from './Accents';
import { CharacterColor, CharacterColors } from './Characters';
import { randomFor, type Random } from './Random';

/** A theme's name, which is its file's name. Not a union of literals: the set of themes is only
 * known once the files are read, so the registry below is what an id is checked against. */
export type ThemeId = string;

/** The theme that is not a file: its bank is drawn from the rest rather than being a thing an
 * author has to keep written, so it is added after the files rather than among them. */
export const RandomThemeId: ThemeId = 'Случайная';

/** Every theme file's text, keyed by path. Eager, so the registry is whole at module init and no
 * deal ever waits on a load: a tab that read the files in another order would deal another
 * room. */
const files: Record<string, string> = import.meta.glob('../Content/Themes/*.txt', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** One question a line, with the line endings, spacing and duplicates a text file brings taken
 * off. Two questions written the same are one, or a room would be asked it twice. */
function parseBank(text: string): string[] {
  const lines = text.replace(/^\u{FEFF}/u, '').split(/\r?\n/);
  return [...new Set(lines.map((line) => line.trim()).filter(Boolean))];
}

/** Sorted by plain comparison, which is the one ordering a runtime cannot localise differently:
 * every tab has to reach the same order for one room code to deal one bank. */
function byId(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

const fileId = (path: string): string => path.slice(path.lastIndexOf('/') + 1, -4);

const authored = Object.entries(files)
  .map(([path, text]): [ThemeId, string[]] => [fileId(path), parseBank(text)])
  .filter(([, questions]) => questions.length > 0)
  .sort(([a], [b]) => byId(a, b));

/** What each theme asks about. A theme whose file turned up empty is left out rather than dealt
 * into a room whose round could not be played. */
export const ThemeBanks: ReadonlyMap<ThemeId, readonly string[]> = new Map([
  ...authored,
  [RandomThemeId, [...new Set(authored.flatMap(([, questions]) => questions))]],
]);

/** Every theme a room can be given: the files, then the one that is not a file. */
export const ThemeIds: readonly ThemeId[] = [...ThemeBanks.keys()];

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && ThemeBanks.has(value);
}

/** Tints by theme, named for the ones the room needs to hold still. Sorted index for the rest,
 * since the set is only known at runtime and a new file cannot be given a key that does not
 * exist yet. */
const ThemeTints: Readonly<Record<string, CharacterColor>> = {
  Видеоигры: 'Violet',
  Природа: 'Lime',
  Интернет: 'Sky',
  Еда: 'Amber',
  Музыка: 'Rose',
  Кино: 'Coral',
  Работа: 'Yellow',
  Путешествия: 'Mint',
};

/** The accent a theme washes in. A function rather than a table to index into, so the one thing
 * a caller needs is the whole accent: wash and ink belong together. */
export function themeAccent(theme: ThemeId): Accent {
  const named = ThemeTints[theme];
  if (named !== undefined) return Accents[named];
  const index = Math.max(0, ThemeIds.indexOf(theme));
  const fallback = CharacterColors[index % CharacterColors.length];
  return Accents[fallback ?? 'Yellow'];
}

/** Take `count` things off a pool without repetition, shuffling as you go rather than rolling
 * each one and hoping. The one sampler the theme deal and the question decks are both drawn
 * with. */
export function sampleUnique<T>(items: readonly T[], count: number, random: Random): T[] {
  const pool = [...items];
  const taken = Math.min(Math.max(count, 0), pool.length);
  for (let i = 0; i < taken; i += 1) {
    const swapWith = i + Math.floor(random() * (pool.length - i));
    const held = pool[i];
    const drawn = pool[swapWith];
    if (held === undefined || drawn === undefined) return pool.slice(0, taken);
    pool[i] = drawn;
    pool[swapWith] = held;
  }
  return pool.slice(0, taken);
}

/** The themes one room is offered, rolled from its code. One function rather than each caller
 * dealing for itself: the bank has to be the same six on every screen, and the host needs the
 * same six to pick at random out of. */
export function themesForRoom(roomCode: string, count: number): ThemeId[] {
  return dealThemes(randomFor(roomCode), count);
}

/** The themes one lobby is offered, drawn from the whole set without repetition. The randomness
 * is injected so a deal is reproducible from its seed. */
export function dealThemes(random: Random, count: number): ThemeId[] {
  return sampleUnique(ThemeIds, count, random);
}
