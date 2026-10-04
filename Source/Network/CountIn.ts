/**
 * Whether a room has already counted itself in, remembered across a refresh.
 *
 * Told apart from a round under way by whether this device saw it happen, not by how much of
 * the phase is left: a phone that heard about the phase a second late is still here for the
 * start.
 */

const KeyPrefix = 'unorthodox.counted.';

function keyFor(roomCode: string): string {
  return `${KeyPrefix}${roomCode}`;
}

/** Whether this device has already watched this room count itself in. */
export function hasCountedIn(roomCode: string): boolean {
  try {
    return localStorage.getItem(keyFor(roomCode)) !== null;
  } catch {
    // Storage unavailable: the count-in happens on every visit, which is the old way
    // round rather than a broken one.
    return false;
  }
}

/** Remember that this device watched the count-in, so it is not counted in again. */
export function markCountedIn(roomCode: string): void {
  try {
    localStorage.setItem(keyFor(roomCode), String(Date.now()));
  } catch {
    // Nothing to do: without it the count-in repeats on the next visit.
  }
}

/** Forget it, which is what leaving the room means. */
export function clearCountIn(roomCode: string): void {
  try {
    localStorage.removeItem(keyFor(roomCode));
  } catch {
    // Already gone.
  }
}
