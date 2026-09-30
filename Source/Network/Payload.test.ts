import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InMemoryTransport } from './InMemoryTransport';
import { ClientSession, JoinRetryIntervalMs } from './ClientSession';
import { HostSession } from './HostSession';
import { toPayload, readTag, readRole } from './Payload';
import { PlayerLook } from '@/Core';

const look: PlayerLook = { character: 'Butterfly', color: 'Coral' };

const roomCode = 'ABCD';
const RetryInterval = JoinRetryIntervalMs;

/** Number of players in the lobby, read without depending on the phase union. */
function playerCount(hostSession: HostSession): number {
  const state = hostSession.getState();
  return state !== undefined && 'players' in state ? state.players.size : -1;
}

describe('Transport payload handling', () => {
  it('keeps JSON-shaped messages and drops anything else', () => {
    expect(toPayload({ type: 'Join', name: 'Ann' })).toEqual({ type: 'Join', name: 'Ann' });
    expect(toPayload('hello')).toBe('hello');
    expect(toPayload(42)).toBe(42);
    expect(toPayload(undefined)).toBeUndefined();
    expect(toPayload(() => undefined)).toBeUndefined();
  });

  it('reads tags and roles off a message without casting', () => {
    expect(readTag({ type: 'hello', role: 'Host' })).toBe('hello');
    expect(readRole({ type: 'hello', role: 'Host' })).toBe('Host');
    expect(readTag({ type: 'Join', name: 'Ann' })).toBe('Join');
    expect(readRole({ type: 'Join', name: 'Ann' })).toBeUndefined();
    expect(readTag('not an object')).toBeUndefined();
    expect(readRole(null)).toBeUndefined();
  });
});

describe('Host addressing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    InMemoryTransport.resetPeers();
  });

  afterEach(() => {
    vi.useRealTimers();
    InMemoryTransport.resetPeers();
  });

  it('answers a join to the peer it arrived from, not a self-declared id', () => {
    const clientSession = new ClientSession(new InMemoryTransport());
    clientSession.start(roomCode, 'Ann');
    const hostSession = new HostSession(new InMemoryTransport());
    hostSession.start(roomCode, 'Host', look);

    // The client never declares a temporary id, so the host has to answer using
    // the transport address the message actually came from.
    clientSession.join('Ann', look);
    vi.advanceTimersByTime(RetryInterval * 3);

    expect(clientSession.getPlayerId()).toBe('p1');
    expect(playerCount(hostSession)).toBe(2);
  });

  it('sends the join as soon as the host appears, without waiting for a retry', () => {
    const clientSession = new ClientSession(new InMemoryTransport());
    clientSession.start(roomCode, 'Ann');
    clientSession.join('Ann', look);
    // No host yet, so the join is held back.
    expect(clientSession.getPlayerId()).toBeNull();

    const hostSession = new HostSession(new InMemoryTransport());
    hostSession.start(roomCode, 'Host', look);
    // No timer advance: the host being addressable must flush the join at once.
    expect(clientSession.getPlayerId()).toBe('p1');
    expect(playerCount(hostSession)).toBe(2);
  });
});

describe('Client join retry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    InMemoryTransport.resetPeers();
  });

  it('joins once the host appears after the client', () => {
    const clientSession = new ClientSession(new InMemoryTransport());
    clientSession.start(roomCode, 'Ann');
    // No host exists yet, so the join is dropped by the transport.
    clientSession.join('Ann', look);
    expect(clientSession.getPlayerId()).toBeNull();

    const hostSession = new HostSession(new InMemoryTransport());
    hostSession.start(roomCode, 'Host', look);
    // The host cannot announce itself to a peer that joined before it, so the
    // client keeps retrying the buffered join until one lands.
    vi.advanceTimersByTime(RetryInterval * 3);

    expect(clientSession.getPlayerId()).not.toBeNull();
    expect(playerCount(hostSession)).toBe(2);
  });
});

describe('Client join retry termination', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    InMemoryTransport.resetPeers();
  });

  it('stops retrying once the host has answered', () => {
    const clientSession = new ClientSession(new InMemoryTransport());
    clientSession.start(roomCode, 'Ann');
    clientSession.join('Ann', look);

    const hostSession = new HostSession(new InMemoryTransport());
    hostSession.start(roomCode, 'Host', look);
    vi.advanceTimersByTime(RetryInterval * 3);
    const assigned = clientSession.getPlayerId();
    expect(assigned).not.toBeNull();

    // No further retries, so the host does not accumulate duplicate players.
    vi.advanceTimersByTime(RetryInterval * 10);
    expect(playerCount(hostSession)).toBe(2);
    expect(assigned).toBe(clientSession.getPlayerId());
  });

  it('does not retry after the session is stopped', () => {
    const clientSession = new ClientSession(new InMemoryTransport());
    clientSession.start(roomCode, 'Ann');
    clientSession.join('Ann', look);
    clientSession.stop();

    const hostSession = new HostSession(new InMemoryTransport());
    hostSession.start(roomCode, 'Host', look);
    vi.advanceTimersByTime(RetryInterval * 5);

    expect(clientSession.getPlayerId()).toBeNull();
    expect(playerCount(hostSession)).toBe(1);
  });
});
