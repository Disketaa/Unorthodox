/**
 * Which rooms this browser is the host of.
 *
 * The role is not in the link any more, because a link that says who is hosting is a
 * link anyone can edit: change one word in the address and the app will open as the
 * host of somebody else's room. The room code is all a link carries, and what this
 * device can do with that room is remembered here instead — the browser that created
 * the room is the browser that hosts it, which is true whoever pastes the link and
 * false for everybody else.
 *
 * Written when the room is created rather than when the host session starts, because
 * the session is opened on the strength of this: it has to be known before there is a
 * session to ask.
 *
 * Forgetting is the host leaving the room for good. A refresh does not forget it, which
 * is the point: the room the host comes back to is the one they were hosting.
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
