import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InMemoryTransport } from './InMemoryTransport';
import { ClientSession } from './ClientSession';
import { HostSession, HostPlayerId } from './HostSession';
import { PlayerLook } from '@/Core';

const roomCode = 'ABCD';
const hostLook: PlayerLook = { character: 'Butterfly', color: 'Coral' };
const clientLook: PlayerLook = { character: 'Ghost', color: 'Sky' };
/** What a client rolls when it comes back, having forgotten nothing on purpose. */
const freshLook: PlayerLook = { character: 'Star', color: 'Violet' };

/** A host with one client named Ann already at the table. */
function roomWithAnn() {
  const hostSession = new HostSession(new InMemoryTransport());
  hostSession.start(roomCode, 'Host', hostLook);
  const transport = new InMemoryTransport();
  const clientSession = new ClientSession(transport);
  clientSession.start(roomCode, 'Ann');
  clientSession.join('Ann', clientLook);
  return { hostSession, clientSession, transport };
}

/** Undefined outside the lobby, which is the only phase whose state carries a look. */
function lookOf(hostSession: HostSession, playerId: string): PlayerLook | undefined {
  const state = hostSession.getState();
  return state?.phase === 'Lobby' ? state.players.get(playerId)?.look : undefined;
}

describe('Player characters', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    InMemoryTransport.resetPeers();
  });

  afterEach(() => {
    vi.useRealTimers();
    InMemoryTransport.resetPeers();
  });

  it('gives the host the character it started with', () => {
    const { hostSession } = roomWithAnn();
    expect(lookOf(hostSession, HostPlayerId)).toEqual(hostLook);
  });

  it('gives a client the character it joined with', () => {
    const { hostSession, clientSession } = roomWithAnn();
    expect(lookOf(hostSession, clientSession.getPlayerId() ?? '')).toEqual(clientLook);
  });

  it('honours a character change made in the lobby', () => {
    const { hostSession, clientSession } = roomWithAnn();
    clientSession.setLook(freshLook);
    expect(lookOf(hostSession, clientSession.getPlayerId() ?? '')).toEqual(freshLook);
  });

  it('lets the host change its own character', () => {
    const { hostSession } = roomWithAnn();
    hostSession.setOwnLook(freshLook);
    expect(lookOf(hostSession, HostPlayerId)).toEqual(freshLook);
  });
});

describe('A player who closes the tab and comes back', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    InMemoryTransport.resetPeers();
  });

  afterEach(() => {
    vi.useRealTimers();
    InMemoryTransport.resetPeers();
  });

  // A new client under Ann's name, as if her tab had been closed and reopened. The old client
  // is dropped first because that is what closing a tab looks like to the host: it sees the
  // departure, which frees the name. A second client arriving while the first is still
  // connected is a different thing, and is refused rather than seated twice.
  function annReturns(transport: InMemoryTransport, look: PlayerLook): ClientSession {
    transport.simulateLeave();
    const returning = new ClientSession(new InMemoryTransport());
    returning.start(roomCode, 'Ann');
    returning.join('Ann', look);
    vi.advanceTimersByTime(5_000);
    return returning;
  }

  it('keeps the character the host already had for them', () => {
    const { hostSession, transport } = roomWithAnn();
    // The new client rolls a new character, but the host must ignore that roll
    // and restore what it had.
    const returning = annReturns(transport, freshLook);

    expect(returning.getPlayerId()).not.toBeNull();
    expect(lookOf(hostSession, returning.getPlayerId() ?? '')).toEqual(clientLook);
  });

  it('keeps a character the player changed before leaving', () => {
    const { hostSession, clientSession, transport } = roomWithAnn();
    clientSession.setLook(freshLook);
    const id = clientSession.getPlayerId();

    // The last choice the player made is the one that survives, not the roll
    // they happen to arrive with.
    annReturns(transport, clientLook);

    expect(lookOf(hostSession, id ?? '')).toEqual(freshLook);
  });
});

describe('Seat identity in the lobby', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    InMemoryTransport.resetPeers();
  });

  afterEach(() => {
    vi.useRealTimers();
    InMemoryTransport.resetPeers();
  });

  it('reclaims the same player id, so scores are not reset', () => {
    const { hostSession, clientSession, transport } = roomWithAnn();
    const originalId = clientSession.getPlayerId();

    // Ann's tab closes and reopens, so the host sees the departure first.
    transport.simulateLeave();
    const returning = new ClientSession(new InMemoryTransport());
    returning.start(roomCode, 'Ann');
    returning.join('Ann', freshLook);
    vi.advanceTimersByTime(5_000);

    expect(returning.getPlayerId()).toBe(originalId);
    // The roster did not grow: the returning player took over the same seat.
    const state = hostSession.getState();
    expect(state?.phase === 'Lobby' && state.players.size).toBe(2);
  });

  it('treats a different name as a different player', () => {
    const { hostSession } = roomWithAnn();

    const other = new ClientSession(new InMemoryTransport());
    other.start(roomCode, 'Bob');
    other.join('Bob', freshLook);
    vi.advanceTimersByTime(5_000);

    expect(lookOf(hostSession, other.getPlayerId() ?? '')).toEqual(freshLook);
    const state = hostSession.getState();
    expect(state?.phase === 'Lobby' && state.players.size).toBe(3);
  });
});
