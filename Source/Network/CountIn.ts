/**
 * Whether a room has already counted itself in, remembered across a refresh.
 *
 * The count-in is told apart from a round already under way by whether this device
 * has seen it happen before, not by how much of the phase is left: a phone that heard
 * about the phase a second late is still here for the start of the game, and a host
 * who refreshed in the middle of a round is not. Only a device that watched the room
 * get to this point can tell those two apart, so that is what is written down.
 *
 * Kept under the room code, like the host's own state, because it is a fact about one
 * game rather than about one browser: a second device joining the same room later is
 * joining a round that has already been counted in, and must not be counted in again.
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
