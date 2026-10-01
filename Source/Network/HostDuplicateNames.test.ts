import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InMemoryTransport } from './InMemoryTransport';
import { ClientSession } from './ClientSession';
import { HostSession } from './HostSession';
import { forgetClientId } from './ClientIdentity';
import { PlayerLook } from '@/Core';

const roomCode = 'ABCD';
const hostLook: PlayerLook = { character: 'Butterfly', color: 'Coral' };
const clientLook: PlayerLook = { character: 'Ghost', color: 'Sky' };

/** The host and one client named Ann, with Ann's transport for dropping her. */
function roomWithAnn() {
  const hostSession = new HostSession(new InMemoryTransport());
  hostSession.start(roomCode, 'Host', hostLook);
  const transport = new InMemoryTransport();
  const ann = new ClientSession(transport);
  ann.start(roomCode, 'Ann');
  ann.join('Ann', clientLook);
  return { hostSession, transport };
}

/** A client trying to sit down under a name. */
function joinAs(name: string): ClientSession {
  const session = new ClientSession(new InMemoryTransport());
  session.start(roomCode, name);
  session.join(name, clientLook);
  vi.advanceTimersByTime(5_000);
  return session;
}

/**
 * A client trying to sit down under a name from a different browser.
 *
 * The id is forgotten first, which is what makes this a second person rather than the
 * first one returning. Two players under one name are only a problem when they are two
 * players: the same browser coming back is a refresh, and the room has to be able to
 * tell those apart, so a test that did not separate them would be testing neither.
 */
function joinAsFromAnotherBrowser(name: string): ClientSession {
  forgetClientId();
  return joinAs(name);
}

/** How many players the host has seated. */
function rosterSize(hostSession: HostSession): number {
  const state = hostSession.getState();
  return state?.phase === 'Lobby' ? state.players.size : -1;
}

/**
 * The name is how the room tells players apart: it is the handle a returning player
 * keeps, and it is what a score and an answer are attached to. Two live players under
 * one name would be the same person in every one of those, so the second is refused.
 * A name belonging to someone who has dropped is free again.
 */
describe('Two players under one name', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    InMemoryTransport.resetPeers();
  });

  afterEach(() => {
    vi.useRealTimers();
    InMemoryTransport.resetPeers();
  });

  it('refuses the second one while the first is still here', () => {
    const { hostSession } = roomWithAnn();
    const second = joinAsFromAnotherBrowser('Ann');

    expect(second.getBlocked()).toBe('NameTaken');
    expect(second.getPlayerId()).toBeNull();
    expect(rosterSize(hostSession)).toBe(2);
  });

  it('refuses the host’s own name, since the host is playing', () => {
    const { hostSession } = roomWithAnn();
    const impostor = joinAsFromAnotherBrowser('Host');

    expect(impostor.getBlocked()).toBe('NameTaken');
    expect(rosterSize(hostSession)).toBe(2);
  });

  it('lets the name go once the first player has dropped', () => {
    const { hostSession, transport } = roomWithAnn();
    transport.simulateLeave();
    const second = joinAsFromAnotherBrowser('Ann');

    expect(second.getBlocked()).toBeUndefined();
    expect(second.getPlayerId()).not.toBeNull();
    expect(rosterSize(hostSession)).toBe(2);
  });

  it('gives an unused name to a different player', () => {
    const { hostSession } = roomWithAnn();
    const bob = joinAs('Bob');

    expect(bob.getBlocked()).toBeUndefined();
    expect(rosterSize(hostSession)).toBe(3);
  });
});
