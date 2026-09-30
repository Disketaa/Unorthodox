// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { Character } from '@/Design/Components';

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
    const root = document.createElement('div');
    document.body.appendChild(root);
    render(<Character character="Character1" color="Coral" />, root);

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
