/** What the host does to the roster rather than to the state: a look, a pace, a seat taken away,
 * a seat invented. Split out of the session so the file that owns the phase flow owns none of
 * the seating, and each of these reads as the one thing it changes. */
import { PlayerId, PlayerLook, createLogger } from '@/Core';
import type { GameAction, HostState, Pace } from '@/Game';
import type { HostRoster } from './HostRoster';
import type { Transport } from './Transport';
import { botJoin, botsIn } from './Bot';

const log = createLogger('HostRosterActions');

/** Reserved player id of the room creator. */
export const HostPlayerId: PlayerId = 'host';

/** The three things every one of these moves touches: the room's state, the seats, and the wire
 * a kicked player is told on. Passing them rather than the session is what keeps this file from
 * needing a reference back to the class that owns them. */
export interface RosterHost {
  getState(): HostState | undefined;
  readonly roster: HostRoster;
  readonly transport: Transport;
  apply(action: GameAction): void;
  /** How many bots the room has, which is how the next one is numbered. */
  botCount(): number;
  countBot(): void;
}

/** The host changing its own character, as the lobby allows until play starts. */
export function setOwnLook(host: RosterHost, look: PlayerLook): void {
  host.apply({ type: 'SET_LOOK', playerId: HostPlayerId, look });
}

/** The host setting how fast the room plays, which every client is then told. */
export function setPace(host: RosterHost, pace: Pace): void {
  host.apply({ type: 'SET_PACE', pace });
}

/** Put an invented player in the room, for the host trying a full room alone. A join like any
 * other, so the bot can be voted for and kicked. Given a seat of its own rather than claimed
 * from the roster: there is no address behind it, so nothing can go offline. */
export function addBot(host: RosterHost): void {
  const state = host.getState();
  if (state === undefined) return;
  const action = botJoin(state, host.botCount() + 1, Math.random);
  if (action === undefined) return;
  host.countBot();
  host.apply(action);
}

/** Remove a player from the room at the host's word. The address is released before the seat, so
 * a player who walks out of their own kicked session is not then reported as one more dropout
 * by a host that has already forgotten they were here. */
export function kick(host: RosterHost, playerId: PlayerId): void {
  const address = host.roster.addressForSeat(playerId);
  if (address !== undefined) {
    host.transport.sendToPeer(address, { type: 'Kicked' });
    host.roster.releasePeer(address);
  }
  host.roster.releaseSeat(playerId);
  log('info', 'kicking player', playerId);
  host.apply({ type: 'KICK', playerId });
}

/** Hand the turn to the next player in lobby join order. Only the host calls this, and a client
 * pressing it would be two people moving the same turn. */
export function nextTurn(host: RosterHost): void {
  host.apply({ type: 'NEXT_TURN' });
}

/** How many bots the seats hold, read off the room rather than kept in a counter of the host's
 * own: a host that refreshes has the counter but not the memory behind it. */
export function countBots(state: HostState): number {
  return botsIn(state);
}
