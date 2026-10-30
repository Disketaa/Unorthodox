/** The player name is kept in localStorage, so it outlives the tab. Typing does not save it: the
 * name is written when a room is entered, so a half-typed name never becomes the next visit's.
 * Two tabs share it, so the host reads them as one seat. */
const NameStorageKey = 'unorthodox.playerName';

export function loadName(): string {
  try {
    return localStorage.getItem(NameStorageKey) ?? '';
  } catch {
    return '';
  }
}

export function saveName(value: string): void {
  try {
    localStorage.setItem(NameStorageKey, value);
  } catch {
    // Storage may be unavailable in private mode; the name then lasts for the tab only.
  }
}
