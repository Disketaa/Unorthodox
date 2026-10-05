/** The browser environment is the point of this file: a refresh is defined by the browser's own
 * storage surviving it, and without a `localStorage` there is nothing for the client id to come
 * back in. */
// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InMemoryTransport } from './InMemoryTransport';
import { ClientSession } from './ClientSession';
import { HostSession } from './HostSession';
import { forgetClientId } from './ClientIdentity';
import { PlayerLook } from '@/Core';

const roomCode = 'ABCD';
const hostLook: PlayerLook = { character: 'Butterfly', color: 'Coral' };
const clientLook: PlayerLook = { character: 'Ghost', color: 'Sky' };

/** The host, and a client named Ann who is about to be interrupted. */
function roomWithAnn(): { host: HostSession; ann: ClientSession } {
  const host = new HostSession(new InMemoryTransport());
  host.start(roomCode, 'Host', hostLook);
  const ann = new ClientSession(new InMemoryTransport());
  ann.start(roomCode, 'Ann');
  ann.join('Ann', clientLook);
  return { host, ann };
}

/** Ann comes back, which is what a browser refresh amounts to. */
function annReturns(): ClientSession {
  const back = new ClientSession(new InMemoryTransport());
  back.start(roomCode, 'Ann');
  back.join('Ann', clientLook);
  vi.advanceTimersByTime(5_000);
  return back;
}

/** A returning player must get their seat back. The name is the only handle the room has for a
 * player, so a refresh is a new connection claiming a name the room already knows. If the host
 * is still holding that name as taken, the returning player is refused and the seat is never
 * recovered — the room is then permanently short a player it is still waiting on, and no route
 * back in exists for that name at all. */
describe('a player who refreshes', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    InMemoryTransport.resetPeers();
    forgetClientId();
  });

  afterEach(() => {
    vi.useRealTimers();
    InMemoryTransport.resetPeers();
  });

  it('gets the seat back when the host heard them leave', () => {
    const { host, ann } = roomWithAnn();
    ann.stop();
    const back = annReturns();

    expect(back.getBlocked()).toBeUndefined();
    expect(back.getPlayerId()).not.toBeNull();
    const state = host.getState();
    expect(state?.phase === 'Lobby' ? state.players.size : -1).toBe(2);
  });

  it('gets the seat back even when the host never heard them leave', () => {
    // The leave notice rides the relays, and a relay that is down or refusing writes
    // takes it with it. A tab that closes does not get to choose whether the room finds
    // out in time, so a player who is demonstrably talking to the host again must not be
    // locked out by a notice that never arrived.
    const { host, ann } = roomWithAnn();
    ann.stop();
    const back = annReturns();

    expect(back.getBlocked()).toBeUndefined();
    expect(back.getPlayerId()).not.toBeNull();
    const state = host.getState();
    expect(state?.phase === 'Lobby' ? state.players.size : -1).toBe(2);
  });
});
