import { PlayerLook } from '@/Core';
import { Session, SessionRole } from './Session';
import { createHostSession } from './HostSessionFactory';
import { createPlayerSession } from './PlayerSessionFactory';

/** Build the session for a room. The host owns the game state, a client mirrors it. The two
 * roles are built apart from each other in their own files, since a role is a long list of
 * methods each one either forwards or refuses. */
export function createSession(
  role: SessionRole,
  roomCode: string,
  playerName: string,
  look: PlayerLook
): Session {
  return role === 'Host'
    ? createHostSession(roomCode, playerName, look)
    : createPlayerSession(roomCode, playerName, look);
}
