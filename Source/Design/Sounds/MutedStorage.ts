/** Whether this device last asked for quiet, in localStorage rather than the tab: a player who
 * muted the room did so for the room and not for the page they happened to be on. */
const MutedStorageKey = 'unorthodox.muted';

/** The stored choice, or heard if there is none. Written as words rather than a boolean so a
 * half-written value cannot read as an answer. */
export function loadMuted(): boolean {
  try {
    return localStorage.getItem(MutedStorageKey) === 'on';
  } catch {
    return false;
  }
}

/** Remembers the choice. Storage may be unavailable, which is not worth failing over. */
export function saveMuted(muted: boolean): void {
  try {
    localStorage.setItem(MutedStorageKey, muted ? 'on' : 'off');
  } catch {
    // Private mode or a full quota: the choice then lasts for the page only.
  }
}
