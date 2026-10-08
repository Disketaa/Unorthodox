// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { GameConfig } from '@/Game';
import type { SessionPhase, SessionPhaseName } from './UseSessionPhase';

const { playSound } = vi.hoisted(() => ({ playSound: vi.fn() }));

vi.mock('@/Design/Sounds', () => ({ playSound }));

const { usePhaseAlarm } = await import('./UsePhaseAlarm');

/** The room's own shape, since that is all the hook reads. `secondsLeft` from the end of the
 * phase, on this device's clock. */
function phaseOf(
  name: SessionPhaseName,
  secondsLeft: number,
  durationMs = 60_000
): SessionPhase {
  return {
    phase: name,
    durationMs,
    phaseStartedAt: Date.now() - (durationMs - secondsLeft * 1000),
    clockOffsetMs: 0,
    answeredAt: undefined,
    playerNames: new Map(),
    playerLooks: new Map(),
    playerPresence: new Map(),
    playerCount: 0,
    submittedCount: 0,
    turnPlayerId: null,
  };
}

/** The hook, run by a probe so it really runs, redrawn with `move`. */
function Alarm({ phase }: { phase: SessionPhase }) {
  usePhaseAlarm(phase);
  return null;
}

function draw(phase: SessionPhase) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  act(() => render(<Alarm phase={phase} />, container));
  return {
    move: (next: SessionPhase) => act(() => render(<Alarm phase={next} />, container)),
  };
}

beforeEach(() => {
  playSound.mockClear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('the alarm at the end of a phase', () => {
  it('sounds on the second the phase ends, off this device own clock', () => {
    draw(phaseOf('Writing', 3));
    vi.advanceTimersByTime(3_000);
    expect(playSound).toHaveBeenCalledWith('Alarm');
  });

  it('sounds nothing for a phase this browser joined after it had ended', () => {
    // A client joining late, or a tab waking up, is handed the room as it stands: an alarm for a
    // phase nobody watched end is worse than none.
    draw(phaseOf('Writing', -10));
    vi.advanceTimersByTime(60_000);
    expect(playSound).not.toHaveBeenCalled();
  });

  it('sounds nothing for a phase nobody waits out', () => {
    draw(phaseOf('Lobby', 0, 0));
    vi.advanceTimersByTime(60_000);
    expect(playSound).not.toHaveBeenCalled();
  });

  it('sounds nothing when the phase is cut short, since it did not run out', () => {
    // Everybody answered, so the host ends Writing early. The deadline it was armed for never
    // arrives, and the alarm for it goes with it.
    const alarm = draw(phaseOf('Writing', 30));
    vi.advanceTimersByTime(10_000);
    alarm.move(phaseOf('Reviewing', 90, 90_000));
    // Past where Writing would have ended, short of where the phase that replaced it ends.
    vi.advanceTimersByTime(40_000);
    expect(playSound).not.toHaveBeenCalled();
  });

  it('sounds once, not again for the same phase', () => {
    draw(phaseOf('Writing', 1));
    vi.advanceTimersByTime(1_000);
    vi.advanceTimersByTime(10_000);
    expect(playSound.mock.calls).toEqual([['Alarm']]);
  });

  it('sounds nothing when a suspended tab wakes long after the end', () => {
    // The room moved on without it. A tab that is merely slow still sounds.
    draw(phaseOf('Writing', 1));
    vi.setSystemTime(Date.now() + GameConfig.timing.alarmStaleMs * 2);
    vi.advanceTimersByTime(1_000);
    expect(playSound).not.toHaveBeenCalled();
  });

  it('still sounds when the next phase state beats the deadline by a hair', () => {
    // The bar reached zero first and the announcement followed; nothing else is going to ring.
    const alarm = draw(phaseOf('Writing', 0.05));
    alarm.move(phaseOf('Reviewing', 90, 90_000));
    expect(playSound).toHaveBeenCalledWith('Alarm');
  });

  it('sounds nothing on a phase change that had nothing to do with the clock', () => {
    const alarm = draw(phaseOf('Writing', 30));
    alarm.move(phaseOf('Writing', 30));
    vi.advanceTimersByTime(30_000);
    expect(playSound).toHaveBeenCalledTimes(1);
  });
});
