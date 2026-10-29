// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameConfig } from '@/Game';
import { HostSession, InMemoryTransport } from '@/Network';
import { runGameSession } from './PerfHarness';
import { snapshotDelta } from './MemorySnapshot';
import { DefaultThresholds } from '../../Tools/Performance/types';
import type { MemorySnapshot } from '../../Tools/Performance/types';

declare global {
  var WeakRef: { new <T>(object: T): { deref(): T | undefined } };
}

/** How many players in the room, including the host. */
const PlayerCount = GameConfig.limits.maxPlayers;
/** How many rounds to play, long enough to reveal a leak. */
const RoundCount = 6;
/** The first snapshot is cold-start; skip it when checking heap growth. */
const WarmupSnapshots = 1;

const hasGc = typeof gc === 'function';

describe('memory leaks across repeated rounds', () => {
  beforeEach(() => {
    InMemoryTransport.resetPeers();
  });

  afterEach(() => {
    InMemoryTransport.resetPeers();
  });

  it.skipIf(!hasGc)('reports heap for every snapshot, so the test cannot be vacuous', () => {
    const result = runGameSession('LEAK', PlayerCount, RoundCount);
    expect(result.snapshots.every((s) => s.heapUsedJsBytes !== undefined)).toBe(true);
  });

  it('does not grow the global key count between rounds', () => {
    const result = runGameSession('LEAK', PlayerCount, RoundCount);
    let previous: MemorySnapshot | undefined = undefined;
    for (const snapshot of result.snapshots) {
      if (previous !== undefined) {
        const delta = snapshotDelta(previous, snapshot);
        expect(delta.globalKeys).toBeLessThanOrEqual(DefaultThresholds.maxGlobalKeyGrowth);
      }
      previous = snapshot;
    }
  });

  it.skipIf(!hasGc)('does not grow the heap between rounds', () => {
    const result = runGameSession('LEAK', PlayerCount, RoundCount);
    let first: MemorySnapshot | undefined = undefined;
    let last: MemorySnapshot | undefined = undefined;
    let skipped = 0;
    for (const snapshot of result.snapshots) {
      if (snapshot.heapUsedJsBytes === undefined) continue;
      if (skipped < WarmupSnapshots) {
        skipped += 1;
        continue;
      }
      if (first === undefined) first = snapshot;
      last = snapshot;
    }
    if (first === undefined || last === undefined || first.heapUsedJsBytes === undefined || last.heapUsedJsBytes === undefined) {
      return;
    }
    const growth = last.heapUsedJsBytes - first.heapUsedJsBytes;
    const perRound = growth / (result.rounds - WarmupSnapshots);
    expect(perRound).toBeLessThanOrEqual(DefaultThresholds.maxHeapGrowthPerRound);
  });

  it.skipIf(!hasGc)('does not retain the host session after stop', () => {
    const transport = new InMemoryTransport();
    const host = new HostSession(transport);
    host.start('WEAKREF', 'host', { character: 'Butterfly', color: 'Coral' });
    const ref = new WeakRef(host);
    host.stop();
    InMemoryTransport.resetPeers();
    gc?.();
    vi.advanceTimersByTime(0);
    expect(ref.deref()).toBeUndefined();
  });

  it('reports the slowest operation so a regression has a suspect', () => {
    const result = runGameSession('LEAK', PlayerCount, RoundCount);
    expect(result.slowestOp).toBeDefined();
    if (result.slowestOp !== undefined) {
      expect(result.slowestOp.ms).toBeGreaterThan(0);
    }
  });
});
