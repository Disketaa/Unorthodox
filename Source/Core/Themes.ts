/** The themes a room can be given, as shared vocabulary. Core for the same reason the cast is:
 * Design draws a card for one, Game asks one, and the room carries a deal of them. A theme is a
 * file in `Content/Themes` naming its tint and its questions, read here at build time. */
import { Accent, Accents } from './Accents';
import { CharacterColor, CharacterColors, isCharacterColor } from './Characters';
import { randomFor, type Random } from './Random';
import { isKnownThemeId, themeColor, customThemeName, type CustomTheme } from './CustomThemes';

/** A theme's name, which is its file's name. Not a union of literals: the set of themes is only
 * known once the files are read, so the registry below is what an id is checked against. */
export type ThemeId = string;

/** The name a room saved by an older build may name, back when a bank drawn from every theme was
 * itself a theme with a card of its own. Not a theme now and not in the registry; kept so a
 * room saved before this can still be read back as the random bank rather than refused. */
export const LegacyRandomThemeId: ThemeId = 'Случайная';

/** Which of the two ways a room is given its themes, as the lobby's buttons name them. `Random`
 * is the whole bank without naming any of it; `Chosen` is the themes named beside it. Held
 * apart from the names, since a host who came back to the random bank has not forgotten. */
export type ThemeMode = 'Random' | 'Chosen';

/** Whether a stored mode is one this build offers, and `Random` where it is not: a mode nobody
 * can press is not a mode a room can be played in. */
export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'Random' || value === 'Chosen';
}

/** Every theme file's text, keyed by path. Eager, so the registry is whole at module init and no
 * deal ever waits on a load: a tab that read the files in another order would deal another
 * room. */
/** What a theme file holds: the name it calls itself, the tint it washes in, and the questions
 * it asks. All three are the author's rather than this module's, so a ninth theme needs no line
 * of code. */
interface ThemeFile {
  name: string;
  color: CharacterColor;
  questions: readonly string[];
}

const files: Record<string, string> = import.meta.glob('../Content/Themes/*.json', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** What each file says, with a file that will not parse or names no tint left empty rather than
 * taken out of the build: a theme that cannot be read is not a theme the room can be given. */
function parseTheme(text: string): ThemeFile | undefined {
  const read: unknown = parseJson(text);
  if (read === undefined || !isRecord(read)) return undefined;
  const { name, color, questions } = read;
  if (
    typeof name !== 'string' ||
    name.length === 0 ||
    !isCharacterColor(color) ||
    !Array.isArray(questions)
  ) {
    return undefined;
  }
  const asked = [
    ...new Set(
      questions.filter((q): q is string => typeof q === 'string').map((q) => q.trim())
    ),
  ].filter(Boolean);
  return asked.length > 0 ? { name, color, questions: asked } : undefined;
}

function parseJson(text: string): unknown {
  try {
    const read: unknown = JSON.parse(text.replace(/^\u{FEFF}/u, ''));
    return read;
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Sorted by plain comparison, which is the one ordering a runtime cannot localise differently:
 * every tab has to reach the same order for one room code to deal one bank. */
function byId(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

const authored = Object.entries(files)
  .map(([, text]): [ThemeId, ThemeFile] | undefined => {
    const theme = parseTheme(text);
    return theme === undefined ? undefined : [theme.name, theme];
  })
  .filter((entry): entry is [ThemeId, ThemeFile] => entry !== undefined)
  .sort(([a], [b]) => byId(a, b));

/** What each theme asks about, and the tint it washes in. A theme whose file turned up empty or
 * unreadable is left out rather than dealt into a room whose round could not be played. */
export const ThemeBanks: ReadonlyMap<ThemeId, readonly string[]> = new Map(
  authored.map(([id, theme]) => [id, theme.questions])
);

/** The tint each theme's file names. */
export const ThemeColors: ReadonlyMap<ThemeId, CharacterColor> = new Map(
  authored.map(([id, theme]) => [id, theme.color])
);

/** Every theme there is, which is every file and nothing else. A bank drawn from all of them is
 * the random mode rather than a theme named "Случайная": it had no questions of its own, only
 * the union of the rest, so it was a ninth card that was never one. */
export const ThemeIds: readonly ThemeId[] = [...ThemeBanks.keys()];

export function isThemeId(value: unknown): value is ThemeId {
  return isKnownThemeId(value);
}

/** What names a theme in a room: an authored theme's id, or a custom theme's number. The two are
 * held apart where a theme is looked up in the registry — a number is never an authored theme, and
 * treating it as one would let a custom theme answer to a file's name — but everywhere a room
 * only carries a theme around, a deal, a count, a card, this is the one type. Carried as
 * `ThemeId | number` rather than folded into `ThemeId`, which is `string`: a custom theme has no
 * name to be its id, only the number it was saved under. */
export type ThemeRef = ThemeId | number;

/** Whether a value is something a room can carry as one of its themes: an authored id, or a
 * number a custom theme was saved under. A number is read as a custom theme whether or not this
 * client has that theme saved — a client that has not is shown no questions for it, which is the
 * same as a room naming a theme whose file is missing. */
export function isThemeRef(value: unknown): value is ThemeRef {
  return isThemeId(value) || (typeof value === 'number' && Number.isInteger(value));
}

/** A theme's name as the room reads it: the file's name for an authored theme, the name the host
 * gave it for a custom one, and the bare number for a custom theme this client has not saved —
 * which is all that can be said about a theme whose text never reached this tab. */
export function themeName(theme: ThemeRef): string {
  if (typeof theme === 'string') return theme;
  return customThemeName(theme) ?? String(theme);
}

/** The accent a theme washes in. A function rather than a table to index into, so the one thing
 * a caller needs is the whole accent: wash and ink belong together. A custom theme's tint is
 * honoured where a file's is not. */
export function themeAccent(theme: ThemeRef): Accent {
  const named = themeColor(theme);
  if (named !== undefined) return Accents[named];
  const index = Math.max(0, ThemeIds.indexOf(theme as ThemeId));
  const fallback = CharacterColors[index % CharacterColors.length];
  return Accents[fallback ?? 'Yellow'];
}

/** Take `count` things off a pool without repetition, shuffling as you go rather than rolling
 * each one and hoping. The one sampler the theme deal, the question decks and the enchantment's
 * letters are all drawn with. */
export function sampleUnique<T>(items: readonly T[], count: number, random: Random): T[] {
  const shuffled = shuffle([...items], random);
  return shuffled.slice(0, Math.min(Math.max(count, 0), shuffled.length));
}

/** The list in a new order, by exchanging each place with one further down the list. */
function shuffle<T>(pool: T[], random: Random): T[] {
  for (let i = 0; i < pool.length; i += 1) {
    const swapWith = i + Math.floor(random() * (pool.length - i));
    const held = pool[i];
    const drawn = pool[swapWith];
    if (held === undefined || drawn === undefined) return pool;
    pool[i] = drawn;
    pool[swapWith] = held;
  }
  return pool;
}

/** The themes a room may be given, given which way it is given them, which it has named, and which
 * custom themes this client knows. The random bank is the whole set — authored and custom
 * together, since a custom theme is as much the room's as any file in the registry. A room naming
 * none under `Chosen` is read the same way rather than as a room with nothing to play. */
export function themePool(
  mode: ThemeMode,
  selection: readonly ThemeRef[] | undefined,
  customThemes: readonly CustomTheme[] = []
): readonly ThemeRef[] {
  const customIds = customThemes.map((theme) => theme.id);
  if (mode !== 'Chosen' || selection === undefined || selection.length === 0) {
    return [...ThemeIds, ...customIds];
  }
  return [...ThemeIds, ...customIds].filter((theme) => selection.includes(theme));
}

/** The themes one room is offered, rolled from its code and dealt out of the pool the host has
 * left switched on. One function rather than each caller dealing for itself: the bank has to be
 * the same six on every screen, and the host needs the same six to pick at random out of. */
export function themesForRoom(
  roomCode: string,
  count: number,
  pool: readonly ThemeRef[] = ThemeIds
): ThemeRef[] {
  return dealThemes(randomFor(roomCode), count, pool);
}

/** The themes one lobby is offered, drawn from the pool without repetition. The randomness is
 * injected so a deal is reproducible from its seed. */
export function dealThemes(
  random: Random,
  count: number,
  pool: readonly ThemeRef[] = ThemeIds
): ThemeRef[] {
  return sampleUnique(pool, count, random);
}
