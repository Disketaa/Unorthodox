// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameConfig } from '@/Game';
import { InMemoryTransport, HostSession } from '@/Network';
import { runGameSession, runGameSessionP95, assertNoPeerLeak } from './PerfHarness';
import { FrameTimer } from '../../Tools/Performance/FrameTimer';
import { DefaultThresholds } from '../../Tools/Performance/types';

/** How many players in the room, including the host. */
const PlayerCount = GameConfig.limits.maxPlayers;
/** How many rounds to play. */
const RoundCount = 4;
/** How many times to repeat for p95. 100 makes p95 a true percentile, not the max. */
const Repeats = 100;
/** 10 players is not more than this multiple of 3 players per player. */
const PerPlayerSlack = 1.5;
/** Floor the baseline so sub-millisecond noise does not break the scaling test. */
const MinBaselineMs = 1;

describe('operation budget during gameplay', () => {
  beforeEach(() => {
    InMemoryTransport.resetPeers();
  });

  afterEach(() => {
    InMemoryTransport.resetPeers();
    vi.useRealTimers();
  });

  it('keeps every game operation under the slow-frame threshold', () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] });
    const result = runGameSession('FPS', PlayerCount, RoundCount);
    for (const op of result.ops) {
      expect(op.ms).toBeLessThanOrEqual(DefaultThresholds.maxOpMs);
    }
  });

  it('keeps the p95 total time under the frame budget', () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] });
    const p95 = runGameSessionP95('FPS', PlayerCount, RoundCount, Repeats);
    expect(p95).toBeLessThanOrEqual(DefaultThresholds.maxTotalMs);
  });

  it('scales within a bounded per-player cost from 3 players to max players', () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] });
    const small = Math.max(runGameSessionP95('FPS', 3, RoundCount, Repeats), MinBaselineMs);
    const large = runGameSessionP95('FPS', PlayerCount, RoundCount, Repeats);
    const perPlayerSmall = small / 3;
    const perPlayerLarge = large / PlayerCount;
    expect(perPlayerLarge).toBeLessThanOrEqual(perPlayerSmall * PerPlayerSlack);
  });

  it('measures frame timing with the FrameTimer', () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] });
    const timer = new FrameTimer();
    const transport = new InMemoryTransport();
    const host = new HostSession(transport);
    host.start('FPS', 'host', { character: 'Butterfly', color: 'Coral' });

    timer.tick(() => {
      host.startGame();
    });

    const stats = timer.stats();
    expect(stats.count).toBeGreaterThan(0);
    expect(stats.averageMs).toBeGreaterThanOrEqual(0);
    expect(stats.p95Ms).toBeGreaterThanOrEqual(0);
    expect(stats.slowFrames).toBe(0);

    host.stop();
    InMemoryTransport.resetPeers();
    assertNoPeerLeak();
  });
});
