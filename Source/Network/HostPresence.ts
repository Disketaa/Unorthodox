import { PlayerId } from '@/Core';
import { createLogger } from '@/Core';
import type { HostRoster } from './HostRoster';

const log = createLogger('HostSession');

/**
 * The seat behind a peer that has gone, and what to do about it.
 *
 * Lifted out of `HostSession` because presence is a question about the roster rather
 * than about the session: the roster owns who is on the line, and this is the one
 * thing that happens when a line drops.
 *
 * The address is released first, because a peer that reconnects claims a fresh address
 * for the same seat, and the old one must not be able to mark them gone a second time
 * after they have already come back.
 *
 * Returns the action to apply rather than applying it, so the caller keeps the one
 * place the state changes and is written down. Marking them gone also stops the room
 * waiting on their answer: a dropped player holds the round open otherwise, and nothing
 * would ever close it.
 */
export function departureOf(
  peerId: string,
  roster: HostRoster,
): { type: 'SET_ONLINE'; playerId: PlayerId; isOnline: false } | undefined {
  const playerId = roster.seatForPeer(peerId);
  roster.releasePeer(peerId);
  if (playerId === undefined) {
    log('warn', 'peer left without a seat', peerId);
    return undefined;
  }
  log('info', 'player went offline', playerId);
  roster.markGone(playerId);
  return { type: 'SET_ONLINE', playerId, isOnline: false };
}
