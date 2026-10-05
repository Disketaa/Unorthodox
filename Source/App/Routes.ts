import { normalizeRoomCode, isValidRoomCode } from './RoomCode';
import { GameConfig } from '@/Game';

export type Route =
  | { kind: 'Join' }
  | { kind: 'Gallery' }
  | { kind: 'Room'; roomCode: string };

/** Hash routing, because GitHub Pages does not rewrite SPA paths. A room link carries the code
 * and nothing else: it used to carry the role too, which was a hole, since a link saying who is
 * hosting is a link anyone can edit. See `RoomOwnership`. */
export function parseRoute(hash: string): Route {
  const segments = decodeSegments(hash);

  if (segments[0] === 'Gallery') {
    return { kind: 'Gallery' };
  }
  if (segments[0] === 'Room' && segments[1] !== undefined) {
    // The raw segment is checked as well as the normalised one, because normalising
    // truncates and a five letter path would otherwise join the wrong room. Anything
    // after the code is ignored, so old links still open the room they name.
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

/** Drop path segments left behind by a hand-typed or pasted link. Routing is entirely in the
 * fragment, but a stray path survives into every copied link and 404s. The base directory is
 * unknown here, so the path is cut at the first segment naming a route. */
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

/** Move to a route, with an empty path meaning the entry screen. Assigning an empty hash leaves
 * a bare `#` that rides along in every copied link, so the root route drops the fragment
 * through the history API. Hashchange is raised by hand; the API does not. */
export function navigate(path: string): void {
  if (path !== '') {
    window.location.hash = path;
    return;
  }
  window.history.pushState(null, '', `${basePath()}${window.location.search}`);
  window.dispatchEvent(new Event('hashchange'));
}
