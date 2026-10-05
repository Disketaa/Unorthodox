// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { installFakeAudio, type FakeAudio } from './FakeAudio';

let fake: FakeAudio;

beforeEach(() => {
  vi.resetModules();
  fake = installFakeAudio();
});

/** A fresh module per test, so decoded clips are not carried over. */
function freshBank() {
  return import('./SoundBank');
}

describe('SoundBank preloading', () => {
  it('decodes the clips up front, so a press is not waiting on the network', async () => {
    const { preloadSounds } = await freshBank();
    await preloadSounds();
    expect(fake.decoded.length).toBe(2);
  });

  it('fetches each clip once, however many callers ask at once', async () => {
    const { preloadSounds } = await freshBank();
    await Promise.all([preloadSounds(), preloadSounds()]);
    expect(fake.fetched.length).toBe(2);
  });

  it('leaves the clips already decoded alone', async () => {
    const { preloadSounds } = await freshBank();
    await preloadSounds();
    await preloadSounds();
    expect(fake.decoded.length).toBe(2);
  });

  it('warms the context on any press in the page, not on the button', async () => {
    // The button moved and the pop arrived afterwards, because the first press
    // also paid for the audio thread starting up. A touch anywhere is the same
    // gesture to the browser and usually happens first.
    const { preloadSounds } = await freshBank();
    await preloadSounds();
    expect(fake.resumed).toBe(0);
    window.dispatchEvent(new Event('pointerdown'));
    expect(fake.resumed).toBeGreaterThan(0);
  });

  it('stops listening once a gesture has woken it', async () => {
    const { preloadSounds } = await freshBank();
    await preloadSounds();
    window.dispatchEvent(new Event('pointerdown'));
    const after = fake.resumed;
    window.dispatchEvent(new Event('pointerdown'));
    expect(fake.resumed).toBe(after);
  });
});

describe('SoundBank playback', () => {
  it('plays immediately once the clip is held', async () => {
    const { preloadSounds, playSound } = await freshBank();
    await preloadSounds();
    playSound('Pop');
    expect(fake.sounded.length).toBe(1);
    expect(fake.sounded[0].started).toBe(true);
  });

  it('plays a press that beat its own load, once the decode lands', async () => {
    // A press with nothing preloaded is held until its decode lands rather than
    // being dropped, so the first sound on a page is late but not missing.
    const { playSound } = await freshBank();
    playSound('Pop');
    expect(fake.sounded.length).toBe(0);
    await vi.waitFor(() => expect(fake.sounded.length).toBe(1));
    expect(fake.sounded[0].started).toBe(true);
  });

  it('varies the pitch, so two presses are not the same note', async () => {
    const { preloadSounds, playSound } = await freshBank();
    await preloadSounds();
    for (let press = 0; press < 40; press += 1) playSound('Pop');
    expect(new Set(fake.sounded.map((node) => node.detune.value)).size).toBeGreaterThan(1);
  });

  it('varies the pitch far enough to be heard rather than to wobble', async () => {
    // A few per cent sat under the threshold where anyone could tell two presses
    // apart, which made the variation pointless. A fifth overshot into a joke.
    const { preloadSounds, playSound } = await freshBank();
    await preloadSounds();
    for (let press = 0; press < 200; press += 1) playSound('Pop');
    const semitones = fake.sounded.map((node) => Math.abs(node.detune.value) / 100);
    expect(Math.max(...semitones)).toBeGreaterThan(1.5);
    expect(Math.max(...semitones)).toBeLessThanOrEqual(2.5);
  });

  it('plays nothing rather than throwing when a clip will not load', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')));
    const { preloadSounds, playSound } = await freshBank();
    await preloadSounds();
    expect(() => playSound('Pop')).not.toThrow();
  });
});

describe('SoundBank where it cannot play', () => {
  it('stays silent rather than throwing where there is no Web Audio at all', async () => {
    // happy-dom has no AudioContext, and neither has anything that is not a
    // browser. A press must not depend on the sound existing.
    vi.stubGlobal('AudioContext', undefined);
    const { preloadSounds, playSound } = await freshBank();
    await preloadSounds();
    expect(() => playSound('Pop')).not.toThrow();
    expect(fake.sounded.length).toBe(0);
  });

  it('still resumes a context that a press finds suspended', async () => {
    const { playSound } = await freshBank();
    playSound('Pop');
    expect(fake.resumed).toBeGreaterThan(0);
  });
});
