import { PlayerId } from '@/Core';
import { createLogger } from '@/Core';
import type { HostRoster } from './HostRoster';

const log = createLogger('HostSession');

/**
 * The seat behind a peer that has gone, and what to do about it.
 *
 * Lifted out of `HostSession` because presence is a question about the roster. The address is
 * released first, so a reconnect cannot mark the same seat gone twice.
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
