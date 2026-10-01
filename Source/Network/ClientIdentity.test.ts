// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clientId, forgetClientId } from './ClientIdentity';

describe('the browser id', () => {
  beforeEach(() => {
    forgetClientId();
  });

  it('is the same on every call, so a retried join is not an impostor', () => {
    // The join is re-sent until the host answers. A client that minted a fresh id per
    // call would be seated by the first attempt and refused by its own second one.
    expect(clientId()).toBe(clientId());
  });

  it('survives the page being reloaded', async () => {
    // This is the whole reason the id is kept in storage rather than only in memory, so
    // the test has to be a real reload: the module is thrown away and reloaded while
    // `localStorage` is left alone, which is exactly what a browser refresh does. A
    // reload is not `forgetClientId`, which clears the stored copy too and is therefore
    // a different browser rather than the same one coming back.
    const before = clientId();
    vi.resetModules();
    const reloaded = await import('./ClientIdentity');
    expect(reloaded.clientId()).toBe(before);
  });

  it('is different for a different browser', () => {
    const first = clientId();
    forgetClientId();
    // A fresh localStorage, as a second device or a private window would have.
    localStorage.clear();
    expect(clientId()).not.toBe(first);
  });
});
