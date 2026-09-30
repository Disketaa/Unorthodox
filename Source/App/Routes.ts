import { SessionRole } from './Session';
import { normalizeRoomCode, isValidRoomCode } from './RoomCode';

export type Route =
  | { kind: 'Join' }
  | { kind: 'Gallery' }
  | { kind: 'Room'; roomCode: string; role: SessionRole };

/** Hash routing, because GitHub Pages does not rewrite SPA paths. */
export function parseRoute(hash: string): Route {
  const segments = hash
    .replace(/^#/, '')
    .split('/')
    .filter((segment) => segment.length > 0);

  if (segments[0] === 'Gallery') {
    return { kind: 'Gallery' };
  }
  const role = readRole(segments[2]);
  if (segments[0] === 'Room' && role !== undefined) {
    const roomCode = normalizeRoomCode(segments[1]);
    if (isValidRoomCode(roomCode)) {
      return { kind: 'Room', roomCode, role };
    }
  }
  return { kind: 'Join' };
}

function readRole(segment: string | undefined): SessionRole | undefined {
  return segment === 'Host' || segment === 'Player' ? segment : undefined;
}

export function roomPath(roomCode: string, role: SessionRole): string {
  return `#/Room/${roomCode}/${role}`;
}
