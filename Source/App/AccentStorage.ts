import { DefaultAccent, isCharacterColor, type CharacterColor } from '@/Core';

/**
 * The accent this device last wore, in localStorage.
 *
 * localStorage rather than sessionStorage, which is where the character itself
 * is kept, and for the opposite reason: the character is identity and two
 * people sharing a device should not come back as the same one, while the
 * accent is a taste and there is nothing to collide. A device keeps its colour
 * across tabs and across a closed browser, so the page comes back looking like
 * itself rather than like a first visit.
 *
 * The accent is deliberately not tied to the character's storage: the host may
 * keep a character the player has replaced, and the accent follows what this
 * player last chose for themselves rather than what the room decided they are
 * wearing.
 */
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