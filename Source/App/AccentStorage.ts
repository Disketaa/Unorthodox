import { DefaultAccent, isCharacterColor, type CharacterColor } from '@/Core';

/** The accent this device last wore, in localStorage rather than the sessionStorage holding the
 * character, and for the opposite reason: a character is identity and two people sharing a
 * device should not come back as the same one, an accent is a taste with nothing to collide. */
const AccentStorageKey = 'unorthodox.accent';

/** The stored accent, or the default if there is none or it no longer exists. */
export function loadAccent(): CharacterColor {
  try {
    const raw = localStorage.getItem(AccentStorageKey);
    return raw !== null && isCharacterColor(raw) ? raw : DefaultAccent;
  } catch {
    return DefaultAccent;
  }
}

/** Remembers the accent. Storage may be unavailable, which is not worth failing over. */
export function saveAccent(color: CharacterColor): void {
  try {
    localStorage.setItem(AccentStorageKey, color);
  } catch {
    // Private mode or a full quota: the accent then lasts for the page only.
  }
}