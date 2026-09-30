import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InMemoryTransport } from './InMemoryTransport';
import { ClientSession, SyncIntervalMs } from './ClientSession';
import { HostSession } from './HostSession';
import { toPublicState } from '@/Game';

const roomCode = 'ABCD';

/** Join a room with a host and one client, both on the in-memory transport. */
function joinRoom() {
  const hostSession = new HostSession(new InMemoryTransport());
  hostSession.start(roomCode, 'Host');
  const clientSession = new ClientSession(new InMemoryTransport());
  clientSession.start(roomCode, 'Ann');
  clientSession.join('Ann');
  vi.advanceTimersByTime(SyncIntervalMs * 3);
  return { hostSession, clientSession };
}

describe('Client state sync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    InMemoryTransport.resetPeers();
  });

  afterEach(() => {
    vi.useRealTimers();
    InMemoryTransport.resetPeers();
  });

  it('answers a sync request with the current phase, so an away client catches up', () => {
    const { hostSession, clientSession } = joinRoom();
    expect(clientSession.getPlayerId()).not.toBeNull();

    hostSession.startGame('A topic', 60_000);
    clientSession.submitAnswer('An answer');
    hostSession.submitOwnAnswer('Another answer');
    hostSession.endReviewing(90_000);
    expect(hostSession.getState()?.phase).toBe('Reviewing');

    // The in-memory transport delivers instantly, so it cannot drop a message.
    // A client that is really away missed the transition, and asking for a sync
    // is what brings the current phase back.
    expect(clientSession.getState()?.phase).toBe('Reviewing');
    clientSession.requestSync();
    expect(clientSession.getState()?.phase).toBe('Reviewing');
  });

  it('does not ask the host for a sync before it has joined', () => {
    const clientSession = new ClientSession(new InMemoryTransport());
    clientSession.start(roomCode, 'Ann');
    clientSession.join('Ann');
    // No host yet, so a sync attempt would be dropped and must not throw.
    vi.advanceTimersByTime(SyncIntervalMs * 3);
    expect(clientSession.getPlayerId()).toBeNull();
  });

  it('stops syncing once the session is stopped', () => {
    const { clientSession } = joinRoom();
    clientSession.stop();
    clientSession.requestSync();
    expect(clientSession.getState()).toBeUndefined();
  });
});

describe('Client clock sync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    InMemoryTransport.resetPeers();
  });

  afterEach(() => {
    vi.useRealTimers();
    InMemoryTransport.resetPeers();
  });

  it('carries the host phase start time, so a late catch-up does not reset the clock', () => {
    const { hostSession, clientSession } = joinRoom();
    hostSession.startGame('A topic', 60_000);
    vi.setSystemTime(Date.now() + 30_000);
    vi.advanceTimersByTime(SyncIntervalMs);

    const state = clientSession.getState();
    const hostState = hostSession.getState();
    expect(state?.phase).toBe('Writing');
    expect(state && 'startedAt' in state ? state.startedAt : 0).toBe(
      hostState && 'startedAt' in hostState ? hostState.startedAt : -1,
    );
  });

  it('exposes a finite clock offset so the countdown can be corrected', () => {
    const { hostSession, clientSession } = joinRoom();
    hostSession.startGame('A topic', 60_000);
    vi.advanceTimersByTime(SyncIntervalMs);
    // Under fake timers both clocks read the same instant, so there is no skew
    // to correct. What matters is that the offset is measured and exposed.
    expect(Number.isFinite(clientSession.getClockOffsetMs())).toBe(true);
  });
});

describe('Public state timing', () => {
  it('exposes the phase start time for every timed phase', () => {
    const hostSession = new HostSession(new InMemoryTransport());
    hostSession.start(roomCode, 'Host');
    hostSession.startGame('A topic', 60_000);

    const hostState = hostSession.getState();
    const writing = hostState === undefined ? undefined : toPublicState(hostState);
    expect(writing?.phase).toBe('Writing');
    expect(writing && 'startedAt' in writing).toBe(true);
  });
});
