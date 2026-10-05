import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InMemoryTransport } from './InMemoryTransport';
import { HostSession } from './HostSession';
import { ClientSession } from './ClientSession';
import { PlayerId, PlayerLook } from '@/Core';

const roomCode = 'ABCD';
const hostName = 'Host';
const look: PlayerLook = { character: 'Ghost', color: 'Sky' };
/** The seat Ann is given, being the first client to join. */
const Ann: PlayerId = 'p1';

type Lobby = {
  hostSession: HostSession;
  ann: ClientSession;
  bob: ClientSession;
};

/** The host's roster as id to name, or an empty one outside the lobby. */
function roster(hostSession: HostSession): Map<PlayerId, string> {
  const state = hostSession.getState();
  return state?.phase === 'Lobby'
    ? new Map([...state.players].map(([id, player]) => [id, player.name]))
    : new Map();
}

/** The host and two clients, Ann as `p1` and Bob as `p2`. */
function joinLobby(): Lobby {
  const hostSession = new HostSession(new InMemoryTransport());
  hostSession.start(roomCode, hostName, look);
  const ann = new ClientSession(new InMemoryTransport());
  ann.start(roomCode, 'Ann');
  ann.join('Ann', look);
  const bob = new ClientSession(new InMemoryTransport());
  bob.start(roomCode, 'Bob');
  bob.join('Bob', look);
  return { hostSession, ann, bob };
}

/** Kick Ann, then start a round and answer for everyone still in the room. */
function kickAnnThenPlayRound(room: Lobby): void {
  room.hostSession.kick(Ann);
  room.hostSession.startGame('Test topic', 1000);
  room.bob.submitAnswer('An answer');
  room.hostSession.submitOwnAnswer('Another answer');
  room.hostSession.endReviewing(1000);
}

describe('the host kicking a player', () => {
  beforeEach(() => {
    InMemoryTransport.resetPeers();
  });

  afterEach(() => {
    InMemoryTransport.resetPeers();
  });

  it('takes them out of the roster', () => {
    const { hostSession } = joinLobby();
    hostSession.kick(Ann);
    expect([...roster(hostSession).values()]).not.toContain('Ann');
    expect([...roster(hostSession).values()]).toContain('Bob');
  });

  it('tells the player they were kicked', () => {
    const { hostSession, ann } = joinLobby();
    hostSession.kick(Ann);
    expect(ann.getBlocked()).toBe('Kicked');
  });

  it('leaves the other players alone', () => {
    const { hostSession, bob } = joinLobby();
    hostSession.kick(Ann);
    expect(bob.getBlocked()).toBeUndefined();
  });

  it('frees the name, so someone else may take it', () => {
    const { hostSession } = joinLobby();
    hostSession.kick(Ann);
    const successor = new ClientSession(new InMemoryTransport());
    successor.start(roomCode, 'Ann');
    successor.join('Ann', look);

    expect(successor.getBlocked()).toBeUndefined();
    expect([...roster(hostSession).values()]).toContain('Ann');
  });

  it('ignores a player who is not in the room', () => {
    const { hostSession } = joinLobby();
    const before = roster(hostSession).size;
    hostSession.kick('nobody');
    expect(roster(hostSession).size).toBe(before);
  });
});

/** A removed player's seat is gone, so the round must close on whoever is left rather than hang
 * on an answer that will never arrive. */
describe('the room after a kick', () => {
  beforeEach(() => {
    InMemoryTransport.resetPeers();
  });

  afterEach(() => {
    InMemoryTransport.resetPeers();
  });

  it('stops waiting on an answer from someone it just removed', () => {
    const room = joinLobby();
    kickAnnThenPlayRound(room);
    expect(room.hostSession.getState()?.phase).toBe('Reviewing');
  });
});
