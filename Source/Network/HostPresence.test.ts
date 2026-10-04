import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InMemoryTransport } from './InMemoryTransport';
import { HostSession } from './HostSession';
import { ClientSession } from './ClientSession';
import { PlayerLook } from '@/Core';
import { HostState, PublicState } from '@/Game';

const roomCode = 'ABCD';
const hostName = 'Host';
const clientNames = ['Alice', 'Bob', 'Charlie'];
const look: PlayerLook = { character: 'Ghost', color: 'Sky' };

type Fixture = {
  hostSession: HostSession;
  clientSessions: ClientSession[];
  /** Kept so a test can drop a client off the network. */
  clientTransports: InMemoryTransport[];
};

/** The host and three clients in the lobby, with the transports handed back so a test can take one of them off the network and watch what the room makes of it. */
function joinLobby(): Fixture {
  const hostSession = new HostSession(new InMemoryTransport());
  hostSession.start(roomCode, hostName, look);
  const clientTransports = clientNames.map(() => new InMemoryTransport());
  const clientSessions = clientNames.map((name, index) => {
    const session = new ClientSession(clientTransports[index]);
    session.start(roomCode, name);
    session.join(name, look);
    return session;
  });
  return { hostSession, clientSessions, clientTransports };
}

/** The host's roster as id to presence, or an empty roster if it is not in the lobby. */
function roster(hostSession: HostSession): Map<string, boolean> {
  const state = hostSession.getState();
  if (state?.phase !== 'Lobby') {
    return new Map();
  }
  return new Map([...state.players].map(([id, player]) => [id, player.isOnline]));
}

/** How many players the host still counts as on the line. */
function onlineCount(hostSession: HostSession): number {
  return [...roster(hostSession).values()].filter(Boolean).length;
}

/** Whether any client has been told that this player is gone. */
function aClientKnows(session: ClientSession, playerId: string): boolean {
  const state = session.getState();
  if (state?.phase !== 'Lobby') {
    return false;
  }
  return state.players.some(player => player.id === playerId && !player.isOnline);
}

/** Every client's public state, ignoring any that have none yet. */
function clientStates(fixture: Fixture): PublicState[] {
  return fixture.clientSessions
    .map(session => session.getState())
    .filter((state): state is PublicState => state !== undefined);
}

describe('a player who drops off the network', () => {
  beforeEach(() => {
    InMemoryTransport.resetPeers();
  });

  afterEach(() => {
    InMemoryTransport.resetPeers();
  });

  it('starts with everyone online', () => {
    expect(onlineCount(joinLobby().hostSession)).toBe(clientNames.length + 1);
  });

  it('marks the dropped client offline by name, not just as a lost peer', () => {
    const fixture = joinLobby();
    fixture.clientTransports[0].simulateLeave();
    expect(roster(fixture.hostSession).get('p1')).toBe(false);
  });

  it('keeps the seat, since the player may yet come back', () => {
    const fixture = joinLobby();
    fixture.clientTransports[0].simulateLeave();
    expect(roster(fixture.hostSession).size).toBe(clientNames.length + 1);
  });

  it('leaves everyone else online', () => {
    const fixture = joinLobby();
    fixture.clientTransports[0].simulateLeave();
    expect(onlineCount(fixture.hostSession)).toBe(clientNames.length);
  });

  it('keeps the host online, since the host is the one watching', () => {
    const fixture = joinLobby();
    fixture.clientTransports[0].simulateLeave();
    const state: HostState | undefined = fixture.hostSession.getState();
    expect(state?.phase === 'Lobby' && state.players.get('host')?.isOnline).toBe(true);
  });

  it('ignores a departure from a peer that never claimed a seat', () => {
    const fixture = joinLobby();
    const stranger = new InMemoryTransport();
    stranger.start(roomCode, 'Nobody', false);
    stranger.simulateLeave();
    expect(onlineCount(fixture.hostSession)).toBe(clientNames.length + 1);
  });
});

describe('what the clients are told when somebody drops', () => {
  beforeEach(() => {
    InMemoryTransport.resetPeers();
  });

  afterEach(() => {
    InMemoryTransport.resetPeers();
  });

  it('tells the clients, since only the host sees peers come and go', () => {
    const fixture = joinLobby();
    fixture.clientTransports[0].simulateLeave();
    expect(fixture.clientSessions.slice(1).some(session => aClientKnows(session, 'p1'))).toBe(true);
  });

  it('carries presence into the public state the clients read', () => {
    const fixture = joinLobby();
    fixture.clientTransports[1].simulateLeave();
    expect(clientStates(fixture).some(state =>
      state.phase === 'Lobby' && state.players.some(player => player.id === 'p2' && !player.isOnline)
    )).toBe(true);
  });
});

describe('a player who comes back', () => {
  beforeEach(() => {
    InMemoryTransport.resetPeers();
  });

  afterEach(() => {
    InMemoryTransport.resetPeers();
  });

  // Drop the first client, then bring them back under the same name.
  function dropAndRejoinFirstClient(fixture: Fixture): void {
    fixture.clientTransports[0].simulateLeave();
    const rejoined = new ClientSession(new InMemoryTransport());
    rejoined.start(roomCode, clientNames[0]);
    rejoined.join(clientNames[0], look);
  }

  it('counts them as online again', () => {
    const fixture = joinLobby();
    dropAndRejoinFirstClient(fixture);
    expect(roster(fixture.hostSession).get('p1')).toBe(true);
  });

  it('keeps their seat, rather than adding a second one for the same name', () => {
    const fixture = joinLobby();
    dropAndRejoinFirstClient(fixture);
    expect(roster(fixture.hostSession).size).toBe(clientNames.length + 1);
  });
});
