// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { clockOffsetMs, correctClockFromServer, serverNow, syncClockFromServer } from './Clock';

const RealDateNow = Date.now;

describe('the clock correction', () => {
  beforeEach(() => {
    // Each test gets a fresh module, since installing the shim is deliberately once-only.
    vi.resetModules();
  });

  afterEach(() => {
    Date.now = RealDateNow;
    vi.unstubAllGlobals();
  });

  it('leaves Date.now alone until the correction is installed', async () => {
    const before = Date.now();
    await import('./Clock');
    expect(Date.now()).toBeGreaterThanOrEqual(before);
  });

  it('reports no offset before the server has answered', async () => {
    const clock = await import('./Clock');
    expect(clock.clockOffsetMs()).toBe(0);
    expect(clock.serverNow()).toBe(Date.now());
  });

  it('shifts Date.now by the measured offset, which is what trystero stamps from', async () => {
    const clock = await import('./Clock');
    clock.correctClockFromServer();

    const raw = RealDateNow();
    expect(Date.now()).toBe(raw);

    // A server ten seconds ahead is the failure this exists for: a player whose clock drifts
    // stops hearing peers while every relay still reports open.
    const serverNow = raw + 10_000;
    vi.stubGlobal('fetch', async () => ({
      headers: { get: () => new Date(serverNow).toUTCString() },
    }));

    await clock.syncClockFromServer();
    expect(clock.clockOffsetMs()).toBeGreaterThan(9_000);
    expect(clock.serverNow()).toBeGreaterThan(raw + 9_000);
  });

  it('installs the shim once, so repeated calls do not stack offsets', async () => {
    const clock = await import('./Clock');
    clock.correctClockFromServer();
    clock.correctClockFromServer();
    clock.correctClockFromServer();

    const raw = RealDateNow();
    expect(Date.now()).toBe(raw);
  });

  it('leaves the clock alone when the server sends no Date header', async () => {
    const clock = await import('./Clock');
    clock.correctClockFromServer();
    vi.stubGlobal('fetch', async () => ({ headers: { get: () => null } }));

    await clock.syncClockFromServer();
    expect(clock.clockOffsetMs()).toBe(0);
  });

  it('leaves the clock alone when the request fails outright', async () => {
    const clock = await import('./Clock');
    clock.correctClockFromServer();
    vi.stubGlobal('fetch', async () => {
      throw new Error('offline');
    });

    await expect(clock.syncClockFromServer()).resolves.toBeUndefined();
    expect(clock.clockOffsetMs()).toBe(0);
  });
});
