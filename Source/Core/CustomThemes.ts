/** Custom themes a host pastes into a room: a name, a tint, and questions. Kept beside the
 * authored ones so a custom theme can be dealt into a bank just like any other. */
import { ThemeBanks, ThemeColors, ThemeId } from './Themes';
import { CharacterColor } from './Characters';
import { isCustomTheme } from './CustomThemeJson';

export interface CustomTheme {
  /** The theme's own name, and what it is keyed by. A custom theme has no file to take an id
   * from and does not need one: the name is already there and already what the room shows. Two
   * themes may not share it — the second would replace the first rather than sit beside it. */
  name: string;
  color: CharacterColor;
  questions: readonly string[];
}

/** The key custom themes are saved under in this browser's cache. */
const CustomThemesStorageKey = 'unorthodox-custom-themes';

/** The custom themes this browser knows, keyed by name, loaded from its cache on first use. */
let customThemes: Map<string, CustomTheme> | undefined;

/** What custom themes this browser has saved, or none yet. Loaded once and kept in memory. */
export function loadCustomThemes(): Map<string, CustomTheme> {
  if (customThemes !== undefined) return customThemes;
  customThemes = new Map();
  try {
    const raw = localStorage.getItem(CustomThemesStorageKey);
    if (raw === null) return customThemes;
    const read: unknown = JSON.parse(raw);
    if (!Array.isArray(read)) return customThemes;
    for (const entry of read) {
      // An id is written into older saves and read back as a leftover field rather than a key:
      // the name is the key now, and a theme saved before this had a name to key it by.
      if (!isCustomTheme(entry)) continue;
      // Rebuilt rather than spread, so an `id` written by a build that still numbered themes is
      // dropped on the way in rather than carried along beside the name for the rest of the room.
      customThemes.set(entry.name, {
        name: entry.name,
        color: entry.color,
        questions: entry.questions,
      });
    }
  } catch {
    customThemes = new Map();
  }
  return customThemes;
}

/** Save the custom themes this browser knows to its cache. */
export function saveCustomThemes(themes: Map<string, CustomTheme>): void {
  try {
    localStorage.setItem(CustomThemesStorageKey, JSON.stringify([...themes.values()]));
  } catch {
    // A full cache is not worth crashing the room over.
  }
}

/** Add one custom theme to this browser's cache and to the live map, under its own name. */
export function addCustomTheme(theme: CustomTheme): void {
  const themes = loadCustomThemes();
  themes.set(theme.name, theme);
  saveCustomThemes(themes);
}

/** Remove one custom theme from this browser's cache and from the live map, by its name. */
export function removeCustomTheme(name: string): void {
  const themes = loadCustomThemes();
  themes.delete(name);
  saveCustomThemes(themes);
}

/** The questions a theme asks, whether from a file or a custom paste. The registry is read first
 * and a name it did not answer for is read from the custom themes, so the two can never both
 * answer to one name. */
export function themeQuestions(theme: ThemeId): readonly string[] | undefined {
  return ThemeBanks.get(theme) ?? customThemes?.get(theme)?.questions;
}

/** Every custom theme this browser has saved, in the order they were saved. Read from the cache
 * rather than the room's state, so a host's themes are still theirs after the browser is
 * closed: a theme is written down when it is pasted, and a room is not where it lives. */
export function savedCustomThemes(): CustomTheme[] {
  return [...loadCustomThemes().values()];
}

/** The tint a theme washes in, whether from a file or a custom paste. An authored theme keeps
 * its file's tint; a name that is not one of the registry's washes in the tint the host picked. */
export function themeColor(theme: ThemeId): CharacterColor | undefined {
  return ThemeColors.get(theme) ?? customThemes?.get(theme)?.color;
}

/** Whether a name is an authored theme's. A custom theme is deliberately not one of these: it is
 * known to the browser that saved it and to nobody else, so the registry stays the one list a
 * theme is an authored one by, and a custom name can never shadow a file. */
export function isKnownThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && ThemeBanks.has(value);
}
