// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('the host dock, remembered between rooms', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
    vi.resetModules();
  });

  // The module fresh, since what it remembers about a toggle outlives one test.
  async function diagnostics() {
    return import('./Diagnostics');
  }

  it('is off in a browser that has never been asked', async () => {
    const { isDebugEnabled } = await diagnostics();
    expect(isDebugEnabled()).toBe(false);
  });

  it('is still on after the host turns it on', async () => {
    const { isDebugEnabled, setDebugEnabled } = await diagnostics();
    setDebugEnabled(true);
    expect(isDebugEnabled()).toBe(true);
  });

  it('is still off after the host turns it back off', async () => {
    // The other half of the flag: storage used to be able to say "on" and never "off", so a
    // browser that had once been asked could not be talked out of it again.
    const { isDebugEnabled, setDebugEnabled } = await diagnostics();
    setDebugEnabled(false);
    expect(isDebugEnabled()).toBe(false);
  });

  it('keeps an off browser off when a debug link is pasted in', async () => {
    const { isDebugEnabled, setDebugEnabled } = await diagnostics();
    setDebugEnabled(false);
    window.history.replaceState(null, '', '/?debug');
    expect(isDebugEnabled()).toBe(false);
  });

  it('still answers a debug link in a browser that has no memory of one', async () => {
    window.history.replaceState(null, '', '/?debug');
    const { isDebugEnabled } = await diagnostics();
    expect(isDebugEnabled()).toBe(true);
  });

  it('reads a leftover value from an older build as on, rather than as nothing', async () => {
    // An earlier build wrote the key with no value at all, and its presence meant on.
    localStorage.setItem('debug', '');
    const { isDebugEnabled } = await diagnostics();
    expect(isDebugEnabled()).toBe(true);
  });
});
