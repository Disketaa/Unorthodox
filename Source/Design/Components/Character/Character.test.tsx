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
  selected?: boolean;
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

/** The outermost `Pop`, the one that reacts to being chosen. */
function chosenPop(root: HTMLElement): Element | null {
  return root.firstElementChild?.firstElementChild ?? null;
}

/** The inner `Pop`, the one that reacts to arriving. */
function arrivingPop(root: HTMLElement): Element | null {
  return chosenPop(root)?.firstElementChild ?? null;
}

/** A root to render into, already attached so effects can flush. */
function stage(): HTMLElement {
  const root = document.createElement('div');
  document.body.appendChild(root);
  return root;
}

/**
 * A character reacts to every action through the same pop, so picking a tint and
 * picking a character are the same movement. This checks the mechanism, not the
 * pixels: an element is rebuilt when the thing it reacts to changes, and that is
 * what restarts the animation. If it stopped, each pop would play once and never
 * again, and nothing else in the suite would notice.
 */
describe('Character pop', () => {
  it('pops on mount', () => {
    const root = mount({ character: 'Character1', color: 'Coral' });
    expect(arrivingPop(root)?.querySelector('svg')).not.toBeNull();
  });

  it('replays when the tint changes', () => {
    const props = { character: 'Character1', color: 'Coral', size: 'Small' } as const;
    const root = stage();
    render(<Character {...props} />, root);
    const before = arrivingPop(root);

    render(<Character {...props} color="Sky" />, root);
    expect(arrivingPop(root)).not.toBeNull();
    expect(arrivingPop(root)).not.toBe(before);
  });

  it('replays when the character is chosen', () => {
    const props = { character: 'Character2', color: 'Mint', size: 'Small' } as const;
    const root = stage();
    render(<Character {...props} />, root);
    const before = chosenPop(root);

    render(<Character {...props} selected={true} />, root);
    expect(chosenPop(root)).not.toBeNull();
    expect(chosenPop(root)).not.toBe(before);
  });

  it('keeps the same elements when nothing relevant changed', () => {
    const props = { character: 'Character2', color: 'Mint', size: 'Small' } as const;
    const root = stage();
    render(<Character {...props} />, root);
    const before = chosenPop(root);

    render(<Character {...props} />, root);
    expect(chosenPop(root)).toBe(before);
  });

  it('swaps the artwork when the character changes', () => {
    const props = { character: 'Character1', color: 'Coral' } as const;
    const root = stage();
    render(<Character {...props} />, root);
    const firstPath = root.querySelector('path')?.getAttribute('d');

    render(<Character character="Character5" color="Coral" />, root);
    expect(root.querySelector('path')?.getAttribute('d')).not.toBe(firstPath);
  });
});

/**
 * The two reactions are separate elements, so that changing one thing does not
 * replay both pops at once.
 */
describe('Character pop independence', () => {
  it('does not replay the chosen pop when only the tint changes', () => {
    const props = { character: 'Character1', color: 'Coral', size: 'Small' } as const;
    const root = stage();
    render(<Character {...props} selected={true} />, root);
    const before = chosenPop(root);

    render(<Character {...props} color="Sky" selected={true} />, root);
    expect(chosenPop(root)).toBe(before);
    expect(arrivingPop(root)).not.toBe(before);
  });
});

/**
 * The per-character values are what make a row of characters feel like nine
 * people arriving rather than one animation played nine times.
 */
describe('Character pop values', () => {
  it('writes the values the pop is driven by', () => {
    const style = styleOf(mount({ character: 'Character1', color: 'Coral' }));
    // A cocked angle, an offset it arrives from, and a stepped timing.
    expect(style).toMatch(/--Pop-Tilt:\s*-?[\d.]+deg/);
    expect(style).toMatch(/--Pop-OffsetX:\s*-?[\d.]+px/);
    expect(style).toMatch(/--Pop-Timing:\s*steps\(\d+, jump-/);
  });

  it('always arrives from above, so a character reads as dropping into place', () => {
    // The vertical offset is negative by construction, not by luck, so a row of
    // characters never surfaces upward from below.
    for (let i = 0; i < 8; i++) {
      const style = styleOf(mount({ character: 'Character1', color: 'Coral' }));
      const y = /--Pop-OffsetY:\s*(-?[\d.]+)px/.exec(style)?.[1];
      expect(y).toBeDefined();
      expect(Number(y)).toBeLessThan(0);
    }
  });
});
