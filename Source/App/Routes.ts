import { normalizeRoomCode, isValidRoomCode } from './RoomCode';
import { GameConfig } from '@/Game';

export type Route =
  | { kind: 'Join' }
  | { kind: 'Gallery' }
  | { kind: 'Room'; roomCode: string };

/**
 * Hash routing, because GitHub Pages does not rewrite SPA paths.
 *
 * A room link carries the code and nothing else. It used to carry the role too, and
 * that was a hole rather than a convenience: a link that says who is hosting is a
 * link anyone can edit, and one word changed in the address is the app opening as the
 * host of somebody else's room. What this device may do with a room is remembered
 * instead — see `RoomOwnership`.
 *
 * The hash is percent-encoded by the browser, and room codes are Cyrillic, so
 * the segments are decoded before reading. A malformed escape sequence falls
 * back to the raw text rather than throwing, which would leave a blank page.
 */
export function parseRoute(hash: string): Route {
  const segments = decodeSegments(hash);

  if (segments[0] === 'Gallery') {
    return { kind: 'Gallery' };
  }
  if (segments[0] === 'Room' && segments[1] !== undefined) {
    // The raw segment is checked as well as the normalised code, because
    // normalising truncates: a five letter path would otherwise be accepted as
    // the first four letters and quietly join the wrong room.
    //
    // Anything after the code is ignored rather than refused, so links made before the
    // role left the address still open the room they name.
    const raw = segments[1];
    if (raw.length > GameConfig.limits.roomCodeLength) {
      return { kind: 'Join' };
    }
    const roomCode = normalizeRoomCode(raw);
    if (isValidRoomCode(roomCode)) {
      return { kind: 'Room', roomCode };
    }
  }
  return { kind: 'Join' };
}

/** Split a hash into decoded, non-empty path segments. */
function decodeSegments(hash: string): string[] {
  return hash
    .replace(/^#/, '')
    .split('/')
    .filter((segment) => segment.length > 0)
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    });
}




/** The first path segment of every route, which is what a stray path is matched on. */
const RouteRoots = new Set(['Room', 'Gallery']);

/**
 * Drop path segments left behind by a hand-typed or pasted link.
 *
 * Routing is entirely in the fragment, so a path is meaningless to the app, but it
 * is not harmless: it survives in every link copied afterwards and on GitHub Pages
 * it turns into a 404 for anyone who opens it. The base directory is unknown to
 * the app, so the path is cut at the first segment that names a route, which
 * leaves a deploy path such as `/Unorthodox/` alone and removes `/Room/5978/Host`.
 *
 * This runs before the router reads the hash, so a link that carries its route in
 * both places keeps working and simply loses the copy nobody can use.
 */
export function pruneStrayPath(): void {
  const path = basePath();
  if (path === window.location.pathname) {
    return;
  }
  window.history.replaceState(null, '', `${path}${window.location.search}${window.location.hash}`);
}

/** The path with everything from the first route-named segment removed. */
function basePath(): string {
  const segments = window.location.pathname.split('/').filter((segment) => segment.length > 0);
  const stray = segments.findIndex((segment) => RouteRoots.has(segment));
  const base = stray === -1 ? segments : segments.slice(0, stray);
  return base.length > 0 ? `/${base.join('/')}/` : '/';
}

/** The link to a room, carrying its code and nothing else. */
export function roomPath(roomCode: string): string {
  return `#/Room/${roomCode}`;
}

/**
 * Move to a route, with an empty path meaning the entry screen.
 *
 * Assigning an empty hash leaves a bare `#` in the address bar, which then rides
 * along in every link copied out of the app. Leaving the root route therefore
 * drops the fragment through the history API, which keeps the search string and
 * records an entry so the back button still works.
 *
 * The hashchange event is raised by hand because the router listens for it and
 * the history API does not fire it; a real event is not needed, since the
 * handler only re-reads `location.hash`.
 */
export function navigate(path: string): void {
  if (path !== '') {
    window.location.hash = path;
    return;
  }
  window.history.pushState(null, '', `${basePath()}${window.location.search}`);
  window.dispatchEvent(new Event('hashchange'));
}
