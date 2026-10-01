import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InMemoryTransport } from './InMemoryTransport';
import { ClientSession } from './ClientSession';
import { HostSession } from './HostSession';
import { isClientMessage } from './Protocol';
import { PlayerLook } from '@/Core';
import { Pace, PublicState } from '@/Game';

const roomCode = 'ABCD';
const hostLook: PlayerLook = { character: 'Butterfly', color: 'Coral' };
const clientLook: PlayerLook = { character: 'Ghost', color: 'Sky' };

function startRoom(): { host: HostSession; client: ClientSession } {
  const host = new HostSession(new InMemoryTransport());
  host.start(roomCode, 'Host', hostLook);
  const client = new ClientSession(new InMemoryTransport());
  client.start(roomCode, 'Ann');
  client.join('Ann', clientLook);
  return { host, client };
}

/** The pace the client is currently being shown, if it is in a lobby at all. */
function clientPace(client: ClientSession): Pace | undefined {
  const state = client.getState();
  return state?.phase === 'Lobby' ? state.pace : undefined;
}

describe('the room pace', () => {
  beforeEach(() => {
    InMemoryTransport.resetPeers();
  });

  afterEach(() => {
    InMemoryTransport.resetPeers();
  });

  it('starts every player on the same pace', () => {
    const { host, client } = startRoom();
    const hostState = host.getState();
    expect(hostState?.phase === 'Lobby' ? hostState.pace : undefined).toBe('Standard');
    expect(clientPace(client)).toBe('Standard');
  });

  it('tells the client when the host changes it', () => {
    // The whole reason the pace is in the state rather than in the lobby's own state:
    // a client that kept its own copy would be showing a number the room is not playing.
    const { host, client } = startRoom();
    host.setPace('Fast');
    expect(clientPace(client)).toBe('Fast');
  });

  it('tells the client about a change back again', () => {
    const { host, client } = startRoom();
    host.setPace('Fast');
    host.setPace('Standard');
    expect(clientPace(client)).toBe('Standard');
  });

  it('is not something a client can change on its own', () => {
    // Checked at the gate every message from a client passes, rather than by calling a
    // method a client does not have. The absence is the guarantee: a message asking for
    // a pace is not a client message, so it is discarded before it can reach the
    // reducer, and a client pressing a button has nothing to press *with*. A test that
    // asserted the host ignored it would still pass if a client could ask and the host
    // merely chose not to answer.
    expect(isClientMessage({ type: 'SetPace', pace: 'Fast' })).toBe(false);
  });

  it('keeps the pace on the client even when the state is asked for again', () => {
    // A client that was away re-syncs; the answer is the host's state, so a resync
    // cannot quietly reset the card to the default.
    const { host, client } = startRoom();
    host.setPace('Fast');
    client.requestSync();
    const state: PublicState | undefined = client.getState();
    expect(state?.phase === 'Lobby' ? state.pace : undefined).toBe('Fast');
  });
});
