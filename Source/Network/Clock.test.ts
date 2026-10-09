// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OffsetWorthCorrecting } from './Clock';

const RealDateNow = Date.now;

/** Stand in for a server whose clock reads `seconds` ahead of this device's. */
function serverSaying(seconds: number) {
  return async () => ({
    headers: { get: () => new Date(RealDateNow() + seconds * 1000).toUTCString() },
  });
}

describe('the clock correction', () => {
  beforeEach(() => {
    // A fresh module each time, since installing the shim is deliberately once-only.
    vi.resetModules();
  });

  afterEach(() => {
    Date.now = RealDateNow;
    vi.unstubAllGlobals();
  });

  it('leaves a device whose clock is right alone entirely', async () => {
    const clock = await import('./Clock');
    clock.correctClockFromServer();
    vi.stubGlobal('fetch', serverSaying(0));

    await clock.syncClockFromServer();

    expect(clock.clockStatus()).toBe('fine');
    expect(clock.clockOffsetMs()).toBe(0);
    expect(Date.now()).toBe(RealDateNow());
  });

  it('leaves a device a second out alone, since trystero has five seconds to spare', async () => {
    // The whole point of the threshold: most players are never patched at all, so the blast
    // radius is the small set whose clock actually costs them a peer.
    const clock = await import('./Clock');
    clock.correctClockFromServer();
    vi.stubGlobal('fetch', serverSaying(1));

    await clock.syncClockFromServer();

    expect(clock.clockStatus()).toBe('fine');
    expect(Date.now()).toBe(RealDateNow());
  });

  it('corrects a device past the threshold, since trystero stamps from Date.now', async () => {
    const clock = await import('./Clock');
    clock.correctClockFromServer();
    const drifted = clock.OffsetWorthCorrecting / 1000 + 8;
    vi.stubGlobal('fetch', serverSaying(drifted));

    await clock.syncClockFromServer();

    expect(clock.clockStatus()).toBe('corrected');
    expect(clock.clockOffsetMs()).toBeGreaterThan(clock.OffsetWorthCorrecting / 2);
    expect(Date.now()).toBeGreaterThan(RealDateNow() + 8_000);
  });

  it('corrects a ninety second drift, which is the case that showed up in the field', async () => {
    const clock = await import('./Clock');
    clock.correctClockFromServer();
    vi.stubGlobal('fetch', serverSaying(-92));

    await clock.syncClockFromServer();

    expect(clock.clockStatus()).toBe('corrected');
    expect(clock.clockOffsetMs()).toBeLessThan(-90_000);
  });

  it('installs the shim once, so repeated calls do not stack offsets', async () => {
    const clock = await import('./Clock');
    clock.correctClockFromServer();
    clock.correctClockFromServer();
    clock.correctClockFromServer();

    // Bracketed rather than compared exactly: the two are separate reads of a running clock, and a
    // millisecond between them is not a stacked offset. What is being said is that the shim hands
    // back the real time, once over and no further.
    const before = RealDateNow();
    const shown = Date.now();
    const after = RealDateNow();
    expect(shown).toBeGreaterThanOrEqual(before);
    expect(shown).toBeLessThanOrEqual(after);
  });

  it('reports a failure rather than silently keeping a wrong clock', async () => {
    // A captive portal can answer this request with a header of its own. Without a signal the
    // original bug returns in exactly the same silence it had before.
    const clock = await import('./Clock');
    clock.correctClockFromServer();
    vi.stubGlobal('fetch', async () => ({ headers: { get: () => null } }));

    await clock.syncClockFromServer();

    expect(clock.clockStatus()).toBe('failed');
    expect(clock.clockOffsetMs()).toBe(0);
  });

  it('reports a failure when the request never lands', async () => {
    const clock = await import('./Clock');
    clock.correctClockFromServer();
    vi.stubGlobal('fetch', async () => {
      throw new Error('offline');
    });

    await expect(clock.syncClockFromServer()).resolves.toBeUndefined();
    expect(clock.clockStatus()).toBe('failed');
  });

  it('starts out measuring, so a room opened early knows to try again', async () => {
    const clock = await import('./Clock');
    expect(clock.clockStatus()).toBe('measuring');
  });

  it('exports the threshold it corrects at, so a caller can explain the number', () => {
    expect(OffsetWorthCorrecting).toBeGreaterThan(0);
  });
});
