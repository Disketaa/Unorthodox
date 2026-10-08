// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { GameConfig } from '@/Game';

const { playSound } = vi.hoisted(() => ({ playSound: vi.fn() }));

vi.mock('@/Design/Sounds', () => ({ playSound }));

const { usePhaseAlarm } = await import('./UsePhaseAlarm');
type AlarmClock = Parameters<typeof usePhaseAlarm>[0];

/** The clock a block at the top is drawn on, `secondsLeft` from its end on this device's clock.
 * That is what the alarm follows, so a sub-phase on a clock of its own is just another block. */
function clockOf(secondsLeft: number, ringing = true, paused = false): AlarmClock {
  return { deadline: Date.now() + secondsLeft * 1000, ringing, paused };
}

/** The hook, run by a probe so it really runs, redrawn with `move`. */
function Alarm({ clock }: { clock: AlarmClock }) {
  usePhaseAlarm(clock);
  return null;
}

function draw(clock: AlarmClock) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  act(() => render(<Alarm clock={clock} />, container));
  return {
    move: (next: AlarmClock) => act(() => render(<Alarm clock={next} />, container)),
  };
}

beforeEach(() => {
  playSound.mockClear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('the alarm at the end of a clock', () => {
  it('sounds on the second the clock ends, off this device own clock', () => {
    draw(clockOf(3));
    vi.advanceTimersByTime(3_000);
    expect(playSound).toHaveBeenCalledWith('Alarm');
  });

  it('sounds nothing for a clock this browser joined after it had ended', () => {
    // A client joining late, or a tab waking up, is handed the room as it stands: an alarm for a
    // phase nobody watched end is worse than none.
    draw(clockOf(-10));
    vi.advanceTimersByTime(60_000);
    expect(playSound).not.toHaveBeenCalled();
  });

  it('sounds nothing for a block with no end to announce', () => {
    // An answered bank, and every phase nobody waits out.
    draw(clockOf(3, false));
    vi.advanceTimersByTime(60_000);
    expect(playSound).not.toHaveBeenCalled();
  });

  it('sounds nothing when the clock is cut short, since it did not run out', () => {
    // Everybody answered, so the host ends Writing early. The deadline it was armed for never
    // arrives, and the alarm for it goes with it.
    const alarm = draw(clockOf(30));
    vi.advanceTimersByTime(10_000);
    alarm.move(clockOf(90));
    // Past where Writing would have ended, short of where the phase that replaced it ends.
    vi.advanceTimersByTime(40_000);
    expect(playSound).not.toHaveBeenCalled();
  });

  it('sounds once, not again for the same clock', () => {
    draw(clockOf(1));
    vi.advanceTimersByTime(1_000);
    vi.advanceTimersByTime(10_000);
    expect(playSound.mock.calls).toEqual([['Alarm']]);
  });

  it('sounds nothing when a suspended tab wakes long after the end', () => {
    // The room moved on without it. A tab that is merely slow still sounds.
    draw(clockOf(1));
    vi.setSystemTime(Date.now() + GameConfig.timing.alarmStaleMs * 2);
    vi.advanceTimersByTime(1_000);
    expect(playSound).not.toHaveBeenCalled();
  });

  it('still sounds when the next phase state beats the deadline by a hair', () => {
    // The bar reached zero first and the announcement followed; nothing else is going to ring.
    const alarm = draw(clockOf(0.05));
    alarm.move(clockOf(90));
    expect(playSound).toHaveBeenCalledWith('Alarm');
  });

  it('rings a sub-phase on its own clock, not on the phase clock behind it', () => {
    // The question being read is timed against its own length while the room is still Choosing,
    // and the bank's own clock stopped when the theme was answered. The alarm has to follow the
    // block on screen, so the reveal reaches zero and rings.
    draw(clockOf(3));
    vi.advanceTimersByTime(3_000);
    expect(playSound).toHaveBeenCalledWith('Alarm');
  });

  it('sounds nothing while the room is held, however long it is held for', () => {
    // The hold is already its own announcement; the clock standing still over it is not one.
    const alarm = draw(clockOf(3, true, true));
    vi.advanceTimersByTime(60_000);
    expect(playSound).not.toHaveBeenCalled();
    // And it does not catch up on the way out either: the host moved the deadline by the hold.
    alarm.move(clockOf(3, true, false));
    vi.advanceTimersByTime(1_000);
    expect(playSound).not.toHaveBeenCalled();
  });

  it('sounds nothing on a redraw that had nothing to do with the clock', () => {
    const alarm = draw(clockOf(30));
    alarm.move(clockOf(30));
    vi.advanceTimersByTime(30_000);
    expect(playSound).toHaveBeenCalledTimes(1);
  });
});
