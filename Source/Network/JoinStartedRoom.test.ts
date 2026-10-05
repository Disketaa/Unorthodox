// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InMemoryTransport } from './InMemoryTransport';
import { ClientSession } from './ClientSession';
import { HostSession } from './HostSession';
import { forgetClientId } from './ClientIdentity';
import { PlayerLook } from '@/Core';

const roomCode = 'LATE';
const hostLook: PlayerLook = { character: 'Butterfly', color: 'Coral' };
const clientLook: PlayerLook = { character: 'Ghost', color: 'Sky' };

/** The host, and the game already running. */
function startedRoom(): HostSession {
  const host = new HostSession(new InMemoryTransport());
  host.start(roomCode, 'Danya', hostLook);
  host.startGame('Два слова', 60_000);
  return host;
}

/** A player arriving at that room and asking for a seat. */
function latecomer(): ClientSession {
  forgetClientId();
  const session = new ClientSession(new InMemoryTransport());
  session.start(roomCode, 'Ann');
  session.join('Ann', clientLook);
  vi.advanceTimersByTime(5_000);
  return session;
}

beforeEach(() => {
  vi.useFakeTimers();
  sessionStorage.clear();
});

/** A player who turns up after the room has left its lobby. A room mid-round has nowhere to put
 * them: the answers for this round are being read now and nobody has seen them, so seating them
 * would leave a player the room waits on and cannot use. The alternative — ignoring the join —
 * leaves them on the joining screen forever, which is the same problem with no explanation
 * attached. */
describe('joining a room that has already started', () => {
  it('is refused, and the refusal says why', () => {
    startedRoom();
    expect(latecomer().getBlocked()).toBe('AlreadyStarted');
  });

  it('leaves them out of the roster rather than half in it', () => {
    const host = startedRoom();
    latecomer();
    const state = host.getState();
    // Being given a player id would be worse than being turned away: a seated player
    // the room never sees the answer from holds the round open forever.
    expect(latecomer().getPlayerId()).toBeNull();
    expect(state?.phase === 'Lobby' ? [...state.players.keys()] : ['host']).toEqual(['host']);
  });

  it('stops asking, since no retry could ever be answered', () => {
    startedRoom();
    const ann = latecomer();
    vi.advanceTimersByTime(30_000);
    expect(ann.getBlocked()).toBe('AlreadyStarted');
  });
});
