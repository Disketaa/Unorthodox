import { SessionRole } from './Session';
import { normalizeRoomCode, isValidRoomCode } from './RoomCode';
import { GameConfig } from '@/Game';

export type Route =
  | { kind: 'Join' }
  | { kind: 'Gallery' }
  | { kind: 'Room'; roomCode: string; role: SessionRole };

/**
 * Hash routing, because GitHub Pages does not rewrite SPA paths.
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
  const role = readRole(segments[2]);
  if (segments[0] === 'Room' && role !== undefined) {
    // The raw segment is checked as well as the normalised code, because
    // normalising truncates: a five letter path would otherwise be accepted as
    // the first four letters and quietly join the wrong room.
    const raw = segments[1];
    if (raw.length > GameConfig.limits.roomCodeLength) {
      return { kind: 'Join' };
    }
    const roomCode = normalizeRoomCode(raw);
    if (isValidRoomCode(roomCode)) {
      return { kind: 'Room', roomCode, role };
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

function readRole(segment: string | undefined): SessionRole | undefined {
  return segment === 'Host' || segment === 'Player' ? segment : undefined;
}

export function roomPath(roomCode: string, role: SessionRole): string {
  return `#/Room/${roomCode}/${role}`;
}
