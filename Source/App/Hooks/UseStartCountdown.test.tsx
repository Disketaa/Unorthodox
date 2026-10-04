// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { GameConfig } from '@/Game';
import { clearCountIn, markCountedIn } from '@/Network/CountIn';
import type { SessionPhase, SessionPhaseName } from './UseSessionPhase';

const { playSound } = vi.hoisted(() => ({ playSound: vi.fn() }));

vi.mock('@/Design/Sounds', () => ({ playSound }));

const { useStartCountdown } = await import('./UseStartCountdown');

const roomCode = 'CNTD';

/** The room's own shape, since that is all the hook reads. */
function phaseOf(name: SessionPhaseName, startedAt = Date.now()): SessionPhase {
  return {
    phase: name,
    durationMs: 63_000,
    phaseStartedAt: startedAt,
    clockOffsetMs: 0,
    playerNames: new Map(),
    playerLooks: new Map(),
    playerPresence: new Map(),
    playerCount: 2,
    submittedCount: 0,
  };
}

/** The count-in as it stands, rendered by a probe so the hook really runs. */
function Count({ phase, room }: { phase: SessionPhase; room: string }) {
  const { veiling, count } = useStartCountdown(phase, room);
  return <span>{`${veiling ? 'veil' : ''}${count ?? ''}`}</span>;
}

const { startVeilMs, startCountdownMs, uiTickMs } = GameConfig.timing;

/** Effects are flushed before time is moved, or a tick advances an unattached clock. */
function flush(): void {
  act(() => {
    vi.advanceTimersByTime(0);
  });
}

/**
 * Move this device on by `ms`, one tick at a time.
 *
 * Stepped rather than moved in one go because `act` batches everything inside
 * it and flushes once at the end: a test that jumped the whole count-in in a
 * single call would only ever see the number it landed on, and the numbers and
 * notes in between are the thing being tested.
 */
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
  act(() => {
    render(<Count phase={phase} room={roomCode} />, container);
  });
  flush();
  return {
    read: () => container.textContent ?? '',
    move: (next: SessionPhase) => {
      act(() => {
        render(<Count phase={next} room={roomCode} />, container);
      });
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
});

describe('the count-in', () => {
  it('shows the shade first, and no number', () => {
    expect(mount(phaseOf('Writing')).read()).toBe('veil');
  });

  it('plays one note per number, climbing as it goes, and none for the shade', () => {
    const room = mount(phaseOf('Writing'));
    // A tick short of the shade being up: the first number belongs on screen the
    // moment the shade has finished arriving, and not one moment before it.
    pass(startVeilMs - uiTickMs);
    expect(room.read()).toBe('veil');
    expect(playSound).not.toHaveBeenCalled();
    pass(startCountdownMs + uiTickMs);
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
});

describe('who gets counted in', () => {
  it('counts all three numbers even when this device heard about it late', () => {
    // The one that was broken: a device told about the phase after the host had already
    // started counting used to join the count wherever the host's clock said it was,
    // which on a slow phone was halfway down � so it began at two and never played
    // three. Counted locally, the news arriving late costs nothing but the delay.
    vi.setSystemTime(1_000_000 + 4_000);
    const room = mount(phaseOf('Writing', 1_000_000));
    const seen = [room.read()];
    pass(startVeilMs + 100);
    seen.push(room.read());
    pass(1000);
    seen.push(room.read());
    pass(1000);
    seen.push(room.read());
    expect(seen).toEqual(['veil', '3', '2', '1']);
  });

  it('does not count a room this device has already watched count in', () => {
    // A refresh mid-round, or the same room opened in a new tab: the game has already
    // been counted in on this device, and announcing the start again to players who are
    // already writing in it is the mistake.
    markCountedIn(roomCode);
    const room = mount(phaseOf('Writing'));
    expect(room.read()).toBe('');
    pass(1000);
    expect(room.read()).toBe('');
    expect(playSound).not.toHaveBeenCalled();
  });

  it('counts a room in again once the room has been left', () => {
    const room = mount(phaseOf('Writing'));
    pass(startVeilMs + startCountdownMs);
    expect(room.read()).toBe('');
    markCountedIn(roomCode);
    expect(mount(phaseOf('Writing')).read()).toBe('');
    // Leaving forgets that it was counted in: a new game under the same code is a new
    // game, and it announces itself.
    clearCountIn(roomCode);
    const again = document.createElement('div');
    document.body.appendChild(again);
    act(() => render(<Count phase={phaseOf('Writing')} room={roomCode} />, again));
    flush();
    expect(again.textContent).toBe('veil');
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
