/**
 * Which rooms this browser is the host of.
 *
 * The role is not in the link, because a link that says who is hosting is a
 * link anyone can edit. The room code is all a link carries, so what this
 * device may do with it is remembered here.
 */

const KeyPrefix = 'unorthodox.hosting.';

function keyFor(roomCode: string): string {
  return `${KeyPrefix}${roomCode}`;
}

/** Whether this browser is the host of that room. */
export function hostsRoom(roomCode: string): boolean {
  try {
    return localStorage.getItem(keyFor(roomCode)) !== null;
  } catch {
    // Storage unavailable: without a record there is nothing to host with, and opening
    // as a guest is the safe way to be wrong.
    return false;
  }
}

/** Remember that this browser created the room, which makes it the host of it. */
export function rememberHosting(roomCode: string): void {
  try {
    localStorage.setItem(keyFor(roomCode), String(Date.now()));
  } catch {
    // Nothing to do: the room then has to be hosted the old way, by the link.
  }
}

/** Forget the room, which is what the host leaving it means. */
export function forgetHosting(roomCode: string): void {
  try {
    localStorage.removeItem(keyFor(roomCode));
  } catch {
    // Already gone.
  }
}
