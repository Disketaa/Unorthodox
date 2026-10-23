import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ClientSession } from './ClientSession';
import { InMemoryTransport } from './InMemoryTransport';
import { stallHint } from './ConnectionHint';
import { PlayerLook } from '@/Core';

const roomCode = '4403';
const look: PlayerLook = { character: 'Butterfly', color: 'Coral' };

describe('a client waiting too long', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    InMemoryTransport.resetPeers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // A client that has asked to join and has been answered by nobody.
  function waiting(): ClientSession {
    const session = new ClientSession(new InMemoryTransport());
    session.start(roomCode, 'Ann');
    session.join('Ann', look);
    return session;
  }

  it('says nothing while the wait is still an ordinary one', () => {
    const session = waiting();
    vi.advanceTimersByTime(2_000);
    expect(session.getConnectionHint()).toBeUndefined();
  });

  it('names what is wrong once the wait has outlasted an ordinary connect', () => {
    // The whole point: this used to be a spinner with no explanation, and a drifted device clock
    // produces exactly this wait while every relay still reports open.
    const session = waiting();
    vi.advanceTimersByTime(12_000);
    expect(session.getConnectionHint()).toBe('noPeers');
  });

  it('drops the hint once the room answers, so it is never shown beside a game', () => {
    const session = waiting();
    vi.advanceTimersByTime(12_000);
    expect(session.getConnectionHint()).toBe('noPeers');
    session.stop();
    expect(session.getConnectionHint()).toBeUndefined();
  });

  it('names the relay when the socket never opened, ahead of a clock that cannot explain it', () => {
    // A VPN can swallow the upgrade while DNS and HTTPS still work, so a player waiting on a
    // relay that never opened must not be told the room does not exist.
    expect(stallHint(false)).toBe('relayUnreachable');
    expect(stallHint(true)).toBe('noPeers');
    expect(stallHint(undefined)).toBe('noPeers');
  });

  it('forgets the hint on stop, so a fresh room never inherits the last one', () => {
    const session = waiting();
    vi.advanceTimersByTime(12_000);
    session.stop();

    const again = new ClientSession(new InMemoryTransport());
    again.start(roomCode, 'Bob');
    vi.advanceTimersByTime(1_000);
    expect(again.getConnectionHint()).toBeUndefined();
  });
});
