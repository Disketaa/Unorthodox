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
    read = JSON.parse(json);
  } catch {
    return undefined;
  }
  const entries: unknown[] = Array.isArray(read) ? read : [read];
  const themes: CustomTheme[] = [];
  let nextId = 1;
  for (const entry of entries) {
    if (!isCustomTheme(entry)) return undefined;
    themes.push({
      id: entry.id ?? nextId++,
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
