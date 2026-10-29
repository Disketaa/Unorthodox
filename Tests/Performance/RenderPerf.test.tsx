// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { GameConfig } from '@/Game';
import { InMemoryTransport, HostSession } from '@/Network';
import { takeSnapshot, snapshotDelta } from './MemorySnapshot';
import { FrameTimer } from '../../Tools/Performance/FrameTimer';
import { DefaultThresholds } from '../../Tools/Performance/types';

const playSound = vi.fn();
vi.mock('@/Design/Sounds', () => ({ playSound }));

const { Button } = await import('@/Design/Components/Button');
const { Timer } = await import('@/Design/Components/Timer');

/** How many times to render for the timing measurement. */
const RenderIterations = 100;

describe('render performance', () => {
  beforeEach(() => {
    InMemoryTransport.resetPeers();
    playSound.mockClear();
  });

  afterEach(() => {
    InMemoryTransport.resetPeers();
    vi.useRealTimers();
  });

  it('renders a button within the per-frame budget', () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] });
    const timer = new FrameTimer();
    const container = document.createElement('div');
    document.body.appendChild(container);

    for (let i = 0; i < RenderIterations; i += 1) {
      timer.tick(() => {
        act(() => {
          render(
            <Button variant={i % 2 === 0 ? 'Primary' : 'Secondary'}>
              {`кнопка ${i}`}
            </Button>,
            container
          );
        });
      });
    }

    const stats = timer.stats();
    expect(stats.count).toBe(RenderIterations);
    expect(stats.slowFrames).toBe(0);

    act(() => {
      render(null, container);
    });
    container.remove();
    expect(document.body.childElementCount).toBe(0);
  });

  it('does not grow global keys after a timer component unmounts', () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] });
    const before = takeSnapshot();
    const container = document.createElement('div');
    document.body.appendChild(container);

    act(() => {
      render(
        <Timer remainingMs={30_000} totalMs={60_000} seconds="30">
          Голосуем…
        </Timer>,
        container
      );
    });

    act(() => {
      render(null, container);
    });
    container.remove();

    const after = takeSnapshot();
    const delta = snapshotDelta(before, after);
    expect(delta.globalKeys).toBeLessThanOrEqual(DefaultThresholds.maxGlobalKeyGrowth);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not grow global keys after a full host session stops', () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] });
    const before = takeSnapshot();
    const transport = new InMemoryTransport();
    const host = new HostSession(transport);
    host.start('RENDER', 'host', { character: 'Butterfly', color: 'Coral' });
    host.startGame();
    host.startWriting('topic');
    host.stop();
    InMemoryTransport.resetPeers();

    const after = takeSnapshot();
    const delta = snapshotDelta(before, after);
    expect(delta.globalKeys).toBeLessThanOrEqual(DefaultThresholds.maxGlobalKeyGrowth);
    expect(InMemoryTransport.peerCount()).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('renders a timer with varying props without slowing down', () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] });
    const timer = new FrameTimer();
    const container = document.createElement('div');
    document.body.appendChild(container);

    const totalMs = GameConfig.timing.writingDurationMs;
    for (let i = 0; i < RenderIterations; i += 1) {
      const remainingMs = (totalMs * i) / RenderIterations;
      timer.tick(() => {
        act(() => {
          render(
            <Timer
              remainingMs={remainingMs}
              totalMs={totalMs}
              seconds={`${Math.ceil(remainingMs / 1000)}`}
            >
              Голосуем…
            </Timer>,
            container
          );
        });
      });
    }

    const stats = timer.stats();
    expect(stats.count).toBe(RenderIterations);

    act(() => {
      render(null, container);
    });
    container.remove();
  });
});
