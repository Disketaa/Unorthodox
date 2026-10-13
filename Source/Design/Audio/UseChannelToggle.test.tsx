// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { makeChannel } from './Channel';
import { makeToggleStorage } from './ToggleStorage';
import { useChannelToggle } from './UseChannelToggle';

/** A channel over a storage of its own, so one test's choice cannot greet the next. */
function channel(fallback = true) {
  return makeChannel(makeToggleStorage(`test.${Math.random()}`, fallback));
}

/** The hook's latest reading, driven the way a button drives it. */
function toggle(over: ReturnType<typeof channel>) {
  const seen: boolean[] = [];
  function Probe() {
    const state = useChannelToggle(over);
    seen.push(state.on);
    return (
      <button type="button" onClick={state.onToggle}>
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

describe('the channel toggle', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('reads the channel as it stands, rather than as a room it remembers', () => {
    const control = toggle(channel(false));
    return control.open().then(() => expect(control.latest()).toBe(false));
  });

  it('turns the channel off on the first press', async () => {
    const over = channel();
    const control = toggle(over);
    await control.open();
    await control.press();
    expect(over.enabled()).toBe(false);
    expect(control.latest()).toBe(false);
  });

  it('turns it back on the next press', async () => {
    const over = channel();
    const control = toggle(over);
    await control.open();
    await control.press();
    await control.press();
    expect(over.enabled()).toBe(true);
    expect(control.latest()).toBe(true);
  });

  it('governs only the channel it was given, so two switches stay two switches', async () => {
    const sounds = channel();
    const music = channel();
    const control = toggle(music);
    await control.open();
    await control.press();
    expect(music.enabled()).toBe(false);
    expect(sounds.enabled()).toBe(true);
  });
});
