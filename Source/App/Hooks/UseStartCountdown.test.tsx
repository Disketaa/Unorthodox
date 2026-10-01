// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { GameConfig } from '@/Game';
import type { SessionPhase } from './UseSessionPhase';

const { playSound } = vi.hoisted(() => ({ playSound: vi.fn() }));

vi.mock('@/Design/Sounds', () => ({ playSound }));

const { useStartCountdown } = await import('./UseStartCountdown');

/** A phase of the room's own shape, since that is all the hook reads. */
function phaseOf(name: SessionPhase['phase'], startedAt = Date.now()): SessionPhase {
  return {
    phase: name,
    durationMs: 1,
    phaseStartedAt: startedAt,
    clockOffsetMs: 0,
    playerNames: new Map(),
    playerLooks: new Map(),
    playerCount: 0,
    submittedCount: 0,
  };
}

/** The count-in as it stands, rendered by a probe so the hook really runs. */
function Count({ phase }: { phase: SessionPhase }) {
  const { veiling, count } = useStartCountdown(phase);
  return <span>{`${veiling ? 'veil' : ''}${count ?? ''}`}</span>;
}

const { startVeilMs, startCountdownMs } = GameConfig.timing;

/**
 * Effects are flushed before time is moved, because Preact schedules them and a tick
 * advanced first would be advancing a clock that has not been attached to anything.
 */
function flush(): void {
  act(() => {
    vi.advanceTimersByTime(0);
  });
}

/**
 * Move the room on by `ms`, one tick at a time.
 *
 * Stepped rather than moved in one go because `act` batches everything inside it and
 * flushes once at the end: a test that jumped the whole count-in in a single call
 * would only ever see the number it landed on, and the numbers and notes in between
 * are the thing being tested.
 */
function pass(ms: number): void {
  for (let elapsed = 0; elapsed < ms; elapsed += GameConfig.timing.uiTickMs) {
    act(() => {
      vi.advanceTimersByTime(GameConfig.timing.uiTickMs);
    });
  }
}

function mount(phase: SessionPhase): { read: () => string; move: (phase: SessionPhase) => void } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    render(<Count phase={phase} />, container);
  });
  flush();
  return {
    read: () => container.textContent ?? '',
    move: (next: SessionPhase) => {
      act(() => {
        render(<Count phase={next} />, container);
      });
      flush();
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(1_000_000);
  playSound.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('the count-in', () => {
  it('shows the shade first, and no number', () => {
    expect(mount(phaseOf('Writing')).read()).toBe('veil');
  });

  it('plays one note per number, climbing as it goes, and none for the shade', () => {
    const room = mount(phaseOf('Writing'));
    // A tick short of the shade being up: the first number belongs on screen the
    // moment the shade has finished arriving, and not one moment before it.
    pass(startVeilMs - GameConfig.timing.uiTickMs);
    expect(room.read()).toBe('veil');
    expect(playSound).not.toHaveBeenCalled();
    pass(startCountdownMs + GameConfig.timing.uiTickMs);
    expect(room.read()).toBe('');
    expect(playSound.mock.calls).toEqual([
      ['Pling', 0],
      ['Pling', 2],
      ['Pling', 4],
    ]);
  });

  it('counts nothing at all outside the writing phase', () => {
    expect(mount(phaseOf('Lobby')).read()).toBe('');
    expect(playSound).not.toHaveBeenCalled();
  });

  it('counts the game in once, and not every round', () => {
    const room = mount(phaseOf('Writing'));
    pass(startVeilMs + startCountdownMs);
    expect(room.read()).toBe('');
    expect(playSound).toHaveBeenCalledTimes(3);
    // The next round's writing phase: these players are already writing, so there is
    // nothing to count them in from.
    room.move(phaseOf('Writing'));
    expect(room.read()).toBe('');
    expect(playSound).toHaveBeenCalledTimes(3);
  });

  it('is over for a client that arrived after it', () => {
    const late = phaseOf('Writing', Date.now() - (startVeilMs + startCountdownMs + 500));
    expect(mount(late).read()).toBe('');
    expect(playSound).not.toHaveBeenCalled();
  });
});

describe('the numbers themselves', () => {
  it('counts three, two and one, one second each, and then stops', () => {
    const room = mount(phaseOf('Writing'));
    const seen = [room.read()];
    // Checked in the middle of each number's own second rather than on its boundary,
    // so a count that started a beat early or late fails rather than passing on the
    // seam between two of them.
    pass(startVeilMs + 100);
    seen.push(room.read());
    pass(1000);
    seen.push(room.read());
    pass(1000);
    seen.push(room.read());
    pass(1000);
    seen.push(room.read());
    expect(seen).toEqual(['veil', '3', '2', '1', '']);
  });
});
