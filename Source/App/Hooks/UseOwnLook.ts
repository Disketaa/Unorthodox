import { Session } from '../Session';
import { PlayerId, PlayerLook } from '@/Core';
import { useRememberLook } from './UseRememberLook';

/** This player's own character, once the host has said which one it kept. */
export function useOwnLook(
  session: Session,
  looks: ReadonlyMap<PlayerId, PlayerLook>,
  onLook: (look: PlayerLook) => void
): PlayerLook | undefined {
  const playerId = session.getPlayerId();
  const own = playerId === null ? undefined : looks.get(playerId);
  useRememberLook(own, onLook);
  return own;
}
