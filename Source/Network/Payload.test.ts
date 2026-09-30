import { describe, it, expect } from 'vitest';
import { InMemoryTransport } from './InMemoryTransport';
import { ClientSession } from './ClientSession';
import { HostSession } from './HostSession';
import { toPayload, readHostPeerId } from './Payload';

const roomCode = 'ABCD';

describe('Transport payload handling', () => {
  it('keeps JSON-shaped messages and drops anything else', () => {
    expect(toPayload({ type: 'Join', name: 'Ann' })).toEqual({ type: 'Join', name: 'Ann' });
    expect(toPayload('hello')).toBe('hello');
    expect(toPayload(42)).toBe(42);
    expect(toPayload(undefined)).toBeUndefined();
    expect(toPayload(() => undefined)).toBeUndefined();
  });

  it('reads the host peer id out of the announcement only', () => {
    expect(readHostPeerId({ type: 'HostPeerId', peerId: 'abc' })).toBe('abc');
    expect(readHostPeerId({ type: 'Join', name: 'Ann' })).toBeUndefined();
    expect(readHostPeerId('not an object')).toBeUndefined();
  });
});

describe('Client join buffering', () => {
  it('retries the buffered join once a host is reachable', () => {
    const clientSession = new ClientSession(new InMemoryTransport());
    clientSession.start(roomCode, 'Ann');
    // No host exists yet, so the join cannot be delivered and stays buffered.
    clientSession.join('Ann');
    expect(clientSession.getPlayerId()).toBeNull();

    const hostSession = new HostSession(new InMemoryTransport());
    hostSession.start(roomCode, 'Host');

    // The next send flushes the buffered join, which reaches the new host.
    clientSession.join('Ann');
    expect(clientSession.getPlayerId()).not.toBeNull();
    expect(hostSession.getState()?.players.size).toBe(2);
  });
});
