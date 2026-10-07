import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InMemoryTransport } from './InMemoryTransport';
import { HostSession } from './HostSession';
import { ClientSession } from './ClientSession';
import { PlayerLook } from '@/Core';

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

/** The host and three clients in the lobby, with their transports for dropping one. */
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

/** Drop the first client, then bring them back under the same name. The drop is what frees the
 * name: a second client arriving while the first is still connected would be refused, which is
 * the rule about duplicate names rather than a return. */
function dropAndRejoinFirstClient(fixture: Fixture): ClientSession {
  fixture.clientTransports[0].simulateLeave();
  const rejoined = new ClientSession(new InMemoryTransport());
  rejoined.start(roomCode, clientNames[0]);
  rejoined.join(clientNames[0], look);
  return rejoined;
}

/** Start a round and answer for everyone except the first client, who is left silent on purpose:
 * the host's closing of a phase is driven by the answers it has, so the question every test
 * here asks is whether that one missing answer still counts. The first client is the one under
 * test, never the answerer. */
function startRoundMissingFirstAnswer(fixture: Fixture): void {
  fixture.hostSession.startGame();
  fixture.hostSession.startWriting('Test topic');
  fixture.clientSessions.slice(1).forEach((session) => session.submitAnswer('An answer'));
  fixture.hostSession.submitOwnAnswer('Another answer');
  fixture.hostSession.endReviewing(1000);
}

describe('who the round waits for', () => {
  beforeEach(() => {
    InMemoryTransport.resetPeers();
  });

  afterEach(() => {
    InMemoryTransport.resetPeers();
  });

  it('waits for a player who is here and has not answered', () => {
    const fixture = joinLobby();
    startRoundMissingFirstAnswer(fixture);
    expect(fixture.hostSession.getState()?.phase).toBe('Writing');
  });

  it('stops holding the round open for a player who has dropped', () => {
    const fixture = joinLobby();
    fixture.clientTransports[0].simulateLeave();
    startRoundMissingFirstAnswer(fixture);
    expect(fixture.hostSession.getState()?.phase).toBe('Reviewing');
  });

  it('waits for that player again once they come back', () => {
    const fixture = joinLobby();
    dropAndRejoinFirstClient(fixture);
    startRoundMissingFirstAnswer(fixture);
    expect(fixture.hostSession.getState()?.phase).toBe('Writing');
  });

  it('closes the round once the returned player answers', () => {
    const fixture = joinLobby();
    const returned = dropAndRejoinFirstClient(fixture);
    fixture.hostSession.startGame();
    fixture.hostSession.startWriting('Test topic');
    fixture.clientSessions.slice(1).forEach((session) => session.submitAnswer('An answer'));
    fixture.hostSession.submitOwnAnswer('Another answer');
    returned.submitAnswer('The returned answer');
    fixture.hostSession.endReviewing(1000);

    expect(fixture.hostSession.getState()?.phase).toBe('Reviewing');
  });
});
