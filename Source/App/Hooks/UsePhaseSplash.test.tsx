// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { GameConfig } from '@/Game';
import { PhaseSplashCovered, PhaseSplashMs } from '@/Design/Overlays';
import { clearCountIn, markCountedIn } from '@/Network/CountIn';
import { phaseOf } from './SessionPhaseHarness';
import type { SessionPhase } from './UseSessionPhase';

const { playSound } = vi.hoisted(() => ({ playSound: vi.fn() }));

vi.mock('@/Design/Sounds', () => ({ playSound }));

const { useStartCountdown } = await import('./UseStartCountdown');
const { usePhaseSplash } = await import('./UsePhaseSplash');

const roomCode = 'SPLS';

/** Both hooks wired the way the room wires them, so the ordering between them is the real one. */
function Splash({ phase, room }: { phase: SessionPhase; room: string }) {
  const { endedAt } = useStartCountdown(phase, room);
  const { splashing, covered } = usePhaseSplash(phase, endedAt);
  return <span>{`${splashing ? 'splash' : ''}${covered ? 'covered' : ''}`}</span>;
}

const { startVeilMs, startCountdownMs, uiTickMs } = GameConfig.timing;

/** How long the whole count-in takes, shade and numbers together. */
const countInMs = startVeilMs + startCountdownMs;

function flush(): void {
  act(() => {
    vi.advanceTimersByTime(0);
  });
}

/** Move this device on by `ms`, one tick at a time, so every frame in between is rendered. */
function pass(ms: number): void {
  for (let elapsed = 0; elapsed < ms; elapsed += uiTickMs) {
    act(() => {
      vi.advanceTimersByTime(uiTickMs);
    });
  }
}

function mount(phase: SessionPhase): {
  read: () => string;
  move: (phase: SessionPhase) => void;
} {
  const container = document.createElement('div');
  document.body.appendChild(container);
  act(() => render(<Splash phase={phase} room={roomCode} />, container));
  flush();
  return {
    read: () => container.textContent ?? '',
    move: (next: SessionPhase) => {
      act(() => render(<Splash phase={next} room={roomCode} />, container));
      flush();
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(1_000_000);
  localStorage.clear();
  playSound.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  clearCountIn(roomCode);
});

describe('the splash behind the count-in', () => {
  it('waits for the count to finish before it plays', () => {
    // The bug this covers: the count-in runs during `Choosing`, so a splash measured from the
    // phase start alone arrived on top of the numbers and announced the same phase twice.
    const room = mount(phaseOf('Choosing'));
    expect(room.read()).toBe('');
    pass(startVeilMs + 100);
    expect(room.read()).toBe('');
    pass(startCountdownMs - 100 - uiTickMs);
    expect(room.read()).toBe('');
    // The count is over, and only now does the splash start.
    pass(uiTickMs);
    expect(room.read()).toBe('splash');
  });

  it('plays the moment the count ends, not a beat later', () => {
    const room = mount(phaseOf('Choosing'));
    pass(countInMs);
    expect(room.read()).toBe('splash');
  });

  it('is gone once it has run, so it does not sit over the theme cards', () => {
    const room = mount(phaseOf('Choosing'));
    pass(countInMs);
    expect(room.read()).toBe('splash');
    pass(GameConfig.timing.uiTickMs * 20);
    expect(room.read()).toBe('');
  });
});

describe('when the screen under it may change', () => {
  it('is covered from the moment the disc is full until the hole starts opening', () => {
    // The room swaps its screen inside this window, so a change of phase happens behind flat
    // colour. Outside it the room is partly visible and a swap would be caught halfway through.
    const room = mount(phaseOf('Reviewing'));
    pass(PhaseSplashMs * PhaseSplashCovered.from);
    expect(room.read()).toBe('splashcovered');
  });

  it('is not covered while the disc is still growing over the room', () => {
    // The first stretch of the splash is the yellow arriving, and the room is still visible
    // around the edge of it: a screen changed there would be a screen caught changing.
    const room = mount(phaseOf('Reviewing'));
    pass(PhaseSplashMs * PhaseSplashCovered.from - uiTickMs);
    expect(room.read()).toBe('splash');
  });

  it('is not covered once the hole has started letting the room back', () => {
    // The exit is the room coming back through the middle, so from there the new screen is
    // already being revealed and changing it again would be visible.
    const room = mount(phaseOf('Reviewing'));
    pass(PhaseSplashMs * PhaseSplashCovered.to);
    expect(room.read()).toBe('splash');
  });
});

describe('the splash where there is no count-in', () => {
  it('plays straight away, off the host clock', () => {
    // Reviewing is not counted into, so there is nothing to wait behind and the splash is
    // measured from the phase start like any other.
    expect(mount(phaseOf('Reviewing')).read()).toBe('splash');
  });

  it('plays straight away for a device that was never counted in', () => {
    // A room joined after the count, or refreshed in the middle of one: that device has no count
    // to wait behind, and holding the splash back for a count it never saw would lose it.
    markCountedIn(roomCode);
    expect(mount(phaseOf('Choosing')).read()).toBe('splash');
  });

  it('does not play at all in a phase that has no splash', () => {
    expect(mount(phaseOf('Writing')).read()).toBe('');
    expect(mount(phaseOf('Lobby')).read()).toBe('');
  });
});
