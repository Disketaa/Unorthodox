// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { Character } from '@/Design/Components';

/**
 * Mount a character into a fresh element and return it.
 *
 * The rolled values are written from an effect, which does not run until after
 * the render returns, so `act` has to flush it before anything can be read.
 */
function mount(props: {
  character: 'Character1' | 'Character2' | 'Character5';
  color: 'Coral' | 'Mint' | 'Sky';
  size?: 'Small';
}): HTMLElement {
  const root = document.createElement('div');
  document.body.appendChild(root);
  act(() => {
    render(<Character {...props} />, root);
  });
  return root;
}

/** The custom properties a mounted character carries on its root. */
function styleOf(root: HTMLElement): string {
  return root.firstElementChild?.getAttribute('style') ?? '';
}

/**
 * The reveal plays when a character mounts and again when the tint changes, so
 * that picking a colour is a visible act rather than a silent repaint.
 *
 * This checks the mechanism, not the pixels: a remount of the revealed element is
 * what restarts the animation, and if the key stopped doing that the reveal would
 * play exactly once and then never again, which no unit test elsewhere would
 * catch.
 */
describe('Character reveal', () => {
  it('reveals on mount', () => {
    const root = mount({ character: 'Character1', color: 'Coral' });
    const revealed = root.querySelector('[class*="Appearing"]');
    expect(revealed).not.toBeNull();
    expect(revealed?.querySelector('svg')).not.toBeNull();
  });

  it('rebuilds the revealed element when the tint changes, so the reveal replays', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const props = { character: 'Character1', color: 'Coral', size: 'Small' } as const;
    render(<Character {...props} />, root);

    const before = root.querySelector('[class*="Appearing"]');
    expect(before).not.toBeNull();

    // A different tint is a different element as far as the DOM is concerned,
    // which is what makes the browser replay the animation.
    render(<Character {...props} color="Sky" />, root);
    const after = root.querySelector('[class*="Appearing"]');
    expect(after).not.toBeNull();
    expect(after).not.toBe(before);
  });

  it('keeps the same element when nothing relevant changed', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const props = { character: 'Character2', color: 'Mint', size: 'Small' } as const;
    render(<Character {...props} />, root);
    const before = root.querySelector('[class*="Appearing"]');

    render(<Character {...props} />, root);
    expect(root.querySelector('[class*="Appearing"]')).toBe(before);
  });

  it('swaps the artwork when the character changes', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    render(<Character character="Character1" color="Coral" />, root);
    const firstPath = root.querySelector('path')?.getAttribute('d');

    render(<Character character="Character5" color="Coral" />, root);
    expect(root.querySelector('path')?.getAttribute('d')).not.toBe(firstPath);
  });
});

/**
 * The pop runs entirely off values rolled per character, so these are what make
 * a row of characters feel like nine people arriving rather than one animation
 * played nine times.
 */
describe('Character reveal values', () => {
  it('writes the values the pop is driven by', () => {
    const style = styleOf(mount({ character: 'Character1', color: 'Coral' }));
    // An over-tall start that settles, a cocked angle, an offset it arrives
    // from, and a stepped timing.
    expect(style).toMatch(/--Character-Reveal-Height:\s*\d+%/);
    expect(style).toMatch(/--Character-Reveal-Tilt:\s*-?[\d.]+deg/);
    expect(style).toMatch(/--Character-Reveal-OffsetX:\s*-?[\d.]+px/);
    expect(style).toMatch(/--Character-Reveal-Timing:\s*steps\(\d+, jump-/);
  });

  it('starts over-tall, so the pop springs back rather than growing', () => {
    const style = styleOf(mount({ character: 'Character1', color: 'Coral' }));
    const height = /--Character-Reveal-Height:\s*([\d.]+)%/.exec(style)?.[1];
    expect(Number(height)).toBeGreaterThan(100);
  });

  it('always arrives from above, so a character reads as dropping into place', () => {
    // The vertical offset is negative by construction, not by luck, so a row of
    // characters never surfaces upward from below.
    for (let i = 0; i < 8; i++) {
      const style = styleOf(mount({ character: 'Character1', color: 'Coral' }));
      const y = /--Character-Reveal-OffsetY:\s*(-?[\d.]+)px/.exec(style)?.[1];
      expect(y).toBeDefined();
      expect(Number(y)).toBeLessThan(0);
    }
  });
});
