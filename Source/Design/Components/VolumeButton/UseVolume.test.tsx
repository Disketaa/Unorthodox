// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';

const { isMuted, setMuted } = vi.hoisted(() => ({
  isMuted: vi.fn(() => false),
  setMuted: vi.fn(),
}));
vi.mock('@/Design/Sounds', () => ({ isMuted, setMuted }));

const { useVolumeToggle } = await import('./UseVolume');

/** The hook's latest reading, driven the way the button drives it. */
function volume() {
  const seen: { muted: boolean }[] = [];
  function Probe() {
    const state = useVolumeToggle();
    seen.push({ muted: state.muted });
    return (
      <button type="button" onClick={() => state.onToggleVolume()}>
        toggle
      </button>
    );
  }
  const root = document.createElement('div');
  document.body.appendChild(root);
  return {
    latest: () => seen[seen.length - 1],
    async open() {
      await act(async () => {
        render(<Probe />, root);
      });
    },
    async press() {
      await act(async () => {
        root.querySelector('button')?.click();
      });
    },
  };
}

describe('the volume control', () => {
  beforeEach(() => {
    isMuted.mockClear();
    setMuted.mockClear();
  });

  it('reads the room as heard when the bank says so', async () => {
    const control = volume();
    await control.open();
    expect(control.latest().muted).toBe(false);
  });

  it('asks the bank to turn the sounds off on the first press', async () => {
    const control = volume();
    await control.open();
    await control.press();
    expect(setMuted).toHaveBeenCalledWith(true);
    expect(control.latest().muted).toBe(true);
  });

  it('asks the bank to turn them back on the next press', async () => {
    const control = volume();
    await control.open();
    await control.press();
    await control.press();
    expect(setMuted).toHaveBeenCalledTimes(2);
    expect(setMuted).toHaveBeenNthCalledWith(1, true);
    expect(setMuted).toHaveBeenNthCalledWith(2, false);
    expect(control.latest().muted).toBe(false);
  });
});
