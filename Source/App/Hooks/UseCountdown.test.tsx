// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { useCountdown } from './UseCountdown';

const { playSound } = vi.hoisted(() => ({ playSound: vi.fn() }));
vi.mock('@/Design/Sounds', () => ({ playSound }));

/** The number the block shows, so the hook is really run rather than inspected. */
function Count({ args }: { args: Parameters<typeof useCountdown> }) {
  return <span>{Math.ceil(useCountdown(...args) / 1000)}</span>;
}

function shown(args: Parameters<typeof useCountdown>): number {
  const root = document.createElement('div');
  document.body.appendChild(root);
  act(() => {
    render(<Count args={args} />, root);
  });
  return Number(root.textContent);
}

afterEach(() => {
  vi.useRealTimers();
});

describe('a room that is being held', () => {
  it('keeps the same number however long the hold has been going', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    // Held at the start, with a minute still on the clock.
    const args = [60_000, 1_000_000, 0, true, undefined, true, 1_000_000] as const;
    const first = shown([...args]);
    vi.setSystemTime(1_000_000 + 45_000);
    expect(shown([...args])).toBe(first);
    expect(first).toBe(60);
  });

  it('still shows what was left when the room stopped, after a refresh', () => {
    // A client mounting mid-hold used to read the clock at its own moment and count the hold away,
    // so a player could sit refreshing until the clock ran out under a stopped room — and the
    // answer keys, which close on time up, went dead with it.
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    expect(shown([60_000, 1_000_000, 0, true, undefined, true, 1_010_000])).toBe(50);
    vi.setSystemTime(1_000_000 + 600_000);
    expect(shown([60_000, 1_000_000, 0, true, undefined, true, 1_010_000])).toBe(50);
  });

  it('counts on normally once the room is running again', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    expect(shown([60_000, 1_000_000, 0, true, undefined, false])).toBe(60);
    vi.setSystemTime(1_030_000);
    expect(shown([60_000, 1_000_000, 0, true, undefined, false])).toBe(30);
  });

  it('falls back to the running clock when a hold arrives without a moment to freeze at', () => {
    // An older host sends the hold and not when it happened, so there is nothing to freeze at.
    // Counting the hold away is the lesser fault against freezing on a moment nobody sent.
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    expect(shown([60_000, 1_000_000, 0, true, undefined, true, undefined])).toBe(60);
    vi.setSystemTime(1_030_000);
    expect(shown([60_000, 1_000_000, 0, true, undefined, true, undefined])).toBe(30);
  });
});
