/** Custom themes a host pastes into a room: a name, a tint, and questions. Kept beside the
 * authored ones so a custom theme can be dealt into a bank just like any other. */
import { ThemeBanks, ThemeColors, ThemeId } from './Themes';
import { CharacterColor, isCharacterColor } from './Characters';

export interface CustomTheme {
  /** Auto-assigned number keyed in the map, not the name the room sees. */
  id: number;
  name: string;
  color: CharacterColor;
  questions: readonly string[];
}

/** The key custom themes are saved under in this browser's cache. */
const CustomThemesStorageKey = 'unorthodox-custom-themes';

/** The custom themes this browser knows, loaded from its cache on first use. */
let customThemes: Map<number, CustomTheme> | undefined;

/** What custom themes this browser has saved, or none yet. Loaded once and kept in memory. */
export function loadCustomThemes(): Map<number, CustomTheme> {
  if (customThemes !== undefined) return customThemes;
  customThemes = new Map();
  try {
    const raw = localStorage.getItem(CustomThemesStorageKey);
    if (raw === null) return customThemes;
    const read: unknown = JSON.parse(raw);
    if (!Array.isArray(read)) return customThemes;
    for (const entry of read) {
      if (!isCustomTheme(entry)) continue;
      customThemes.set(entry.id, entry);
    }
  } catch {
    customThemes = new Map();
  }
  return customThemes;
}

/** Save the custom themes this browser knows to its cache. */
export function saveCustomThemes(themes: Map<number, CustomTheme>): void {
  try {
    localStorage.setItem(CustomThemesStorageKey, JSON.stringify([...themes.values()]));
  } catch {
    // A full cache is not worth crashing the room over.
  }
}

/** Add one custom theme to this browser's cache and to the live map. */
export function addCustomTheme(theme: CustomTheme): void {
  const themes = loadCustomThemes();
  themes.set(theme.id, theme);
  saveCustomThemes(themes);
}

/** Remove one custom theme from this browser's cache and from the live map. */
export function removeCustomTheme(id: number): void {
  const themes = loadCustomThemes();
  themes.delete(id);
  saveCustomThemes(themes);
}

/** The questions a theme asks, whether from a file or a custom paste. Custom wins on a clash. */
export function themeQuestions(id: ThemeId | number): readonly string[] | undefined {
  if (typeof id === 'number') {
    return customThemes?.get(id)?.questions;
  }
  return ThemeBanks.get(id);
}

/** The name a custom theme was saved under, or undefined where this client has never seen that
 * number. Read from the cache, so a client that has not been sent the theme cannot draw a card for
 * it and is shown the number instead of somebody else's name for it. */
export function customThemeName(id: number): string | undefined {
  return loadCustomThemes().get(id)?.name;
}

/** The tint a theme washes in, whether from a file or a custom paste. */
export function themeColor(id: ThemeId | number): CharacterColor | undefined {
  if (typeof id === 'number') {
    return customThemes?.get(id)?.color;
  }
  return ThemeColors.get(id);
}

/** Whether a theme id is known, from a file or a custom paste. Custom themes have numeric ids,
 * so a string id is only known if it is an authored theme. */
export function isKnownThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && ThemeBanks.has(value);
}

/** A type guard for a custom theme arriving from the network or a paste. The id is optional on
 * input: it is auto-assigned when missing. */
export function isCustomTheme(value: unknown): value is CustomTheme {
  if (typeof value !== 'object' || value === null) return false;
  const record = { ...value };
  return isCustomThemeRecord(record);
}

/** Parse custom themes from pasted JSON. Accepts a single theme object or an array of them.
 * Returns undefined where the JSON is not a valid theme list. The id is auto-assigned when
 * missing, as the next free number. */
export function parseCustomThemesJson(json: string): CustomTheme[] | undefined {
  let read: unknown;
  try {
    read = JSON.parse(unwrapJsonFence(json));
  } catch {
    return undefined;
  }
  const entries: unknown[] = Array.isArray(read) ? read : [read];
  const themes: CustomTheme[] = [];
  let nextId = 1;
  for (const entry of entries) {
    if (!isCustomTheme(entry)) return undefined;
    themes.push({
      id: (entry.id !== undefined && entry.id !== null) ? entry.id : nextId++,
      name: entry.name,
      color: entry.color,
      questions: entry.questions,
    });
  }
  return themes;
}

function isCustomThemeRecord(record: Record<string, unknown>): boolean {
  return (
    typeof record.name === 'string' &&
    record.name.length > 0 &&
    isCharacterColor(record.color) &&
    Array.isArray(record.questions) &&
    record.questions.every((q): q is string => typeof q === 'string') &&
    record.questions.length > 0
  );
}

/** Take the fence off a paste that carries one. Copying JSON out of a chat or a readme brings the
 * triple backticks and the language tag with it, and those are not part of the theme — the host
 * is not asking for them and the parser cannot read them. Only a fence with a closing fence is
 * taken off, so text that merely starts with backticks is left alone rather than losing whatever
 * follows. */
function unwrapJsonFence(json: string): string {
  const text = json.trim();
  const opening = /^```[a-zA-Z]*\r?\n/.exec(text);
  if (opening === null) return text;
  const rest = text.slice(opening[0].length);
  const closing = rest.lastIndexOf('```');
  if (closing === -1) return text;
  return rest.slice(0, closing).trim();
}

/** Whether a paste carries a code fence, so the editor can put the unwrapped text in the box
 * rather than leaving the host to look at their own backticks. */
export function hasJsonFence(json: string): boolean {
  return unwrapJsonFence(json) !== json.trim();
}

/** Why a paste is not a theme list. A syntax error carries the JSON parser's own message, which
 * names the character it choked on and where — that is the text the host needs to find the typo,
 * so it is passed through rather than replaced with one of our own. A shape error is ours, and
 * carries no message: the popup words it. Kept as a pair rather than a string so that no wording
 * lives in `Core`. */
export type CustomThemesError = { kind: 'syntax'; message: string } | { kind: 'shape' };

/** What is wrong with pasted JSON, or undefined where it is a valid theme list. */
export function customThemesJsonError(json: string): CustomThemesError | undefined {
  try {
    JSON.parse(unwrapJsonFence(json));
  } catch (error) {
    return { kind: 'syntax', message: error instanceof Error ? error.message : String(error) };
  }
  return parseCustomThemesJson(json) === undefined ? { kind: 'shape' } : undefined;
}

/** Repair a paste that is nearly a theme list but not one yet, and hand it back pretty printed.
 * A host copying a theme out of somewhere gets whatever shape it was stored in: one line, no
 * name, no tint. None of that is a reason to refuse the questions. Only the questions are
 * treated as load bearing — without them there is no theme, and guessing at questions would be
 * inventing the host's game. A missing name and a missing tint are filled in, `defaultName` is
 * numbered for as many themes as came in, and the id is auto-assigned as it is on a clean
 * parse. Returns undefined where the text is too far from a theme list to repair. */
export function normalizeCustomThemesJson(json: string, defaultName: string): string | undefined {
  let read: unknown;
  try {
    read = JSON.parse(unwrapJsonFence(json));
  } catch {
    return undefined;
  }
  const entries: unknown[] = Array.isArray(read) ? read : [read];
  const themes: CustomTheme[] = [];
  let nextId = 1;
  for (const [index, entry] of entries.entries()) {
    if (typeof entry !== 'object' || entry === null) return undefined;
    const record: Record<string, unknown> = { ...entry };
    const questions = Array.isArray(record.questions)
      ? record.questions.filter((q): q is string => typeof q === 'string' && q.length > 0)
      : [];
    if (questions.length === 0) return undefined;
    const name =
      typeof record.name === 'string' && record.name.length > 0
        ? record.name
        : `${defaultName} ${index + 1}`;
    themes.push({
      id: typeof record.id === 'number' ? record.id : nextId++,
      name,
      color: isCharacterColor(record.color) ? record.color : 'Yellow',
      questions,
    });
  }
  if (themes.length === 0) return undefined;
  return JSON.stringify(themes, null, 2);
}
