// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { Character } from '@/Design/Components';

/** A root to render into, already attached so effects can flush. */
function stage(): HTMLElement {
  const root = document.createElement('div');
  document.body.appendChild(root);
  return root;
}

type Props = {
  character: 'Butterfly' | 'Explosion' | 'Ghost';
  color: 'Coral' | 'Mint' | 'Sky';
  size?: 'Small';
  pulse?: number;
  index?: number;
};

/** Mount a character, flushing the effect that writes its rolled values. */
function mount(props: Props): HTMLElement {
  const root = stage();
  act(() => {
    render(<Character {...props} />, root);
  });
  return root;
}

/** The custom properties a mounted character carries on its root. */
function styleOf(root: HTMLElement): string {
  return root.firstElementChild?.getAttribute('style') ?? '';
}

/** The one `Pop`, the element the whole reaction lives on. */
function popOf(root: HTMLElement): Element | null {
  return root.firstElementChild?.firstElementChild ?? null;
}

/**
 * A character reacts to every action through the same pop, so picking a tint and
 * picking a character are the same movement. This checks the mechanism, not the
 * pixels: an element is rebuilt when the thing it reacts to changes, and that is
 * what restarts the animation. If it stopped, the pop would play once and never
 * again, and nothing else in the suite would notice.
 */
describe('Character pop', () => {
  it('pops on mount', () => {
    const root = mount({ character: 'Butterfly', color: 'Coral' });
    expect(popOf(root)?.querySelector('svg')).not.toBeNull();
  });

  it('replays when the tint changes', () => {
    const props = { character: 'Butterfly', color: 'Coral', size: 'Small' } as const;
    const root = stage();
    render(<Character {...props} />, root);
    const before = popOf(root);

    render(<Character {...props} color="Sky" />, root);
    expect(popOf(root)).not.toBeNull();
    expect(popOf(root)).not.toBe(before);
  });

  it('replays when the character itself changes', () => {
    // The lobby roster draws whichever character a player is wearing, so a player
    // changing character has to pop as well as one changing tint.
    const props = { character: 'Butterfly', color: 'Coral', size: 'Small' } as const;
    const root = stage();
    render(<Character {...props} />, root);
    const before = popOf(root);

    render(<Character {...props} character="Ghost" />, root);
    expect(popOf(root)).not.toBe(before);
  });
});

/**
 * The reaction is keyed on a count rather than on a flag, so that clicking the
 * same character twice pops it twice, and so that the character that just lost
 * the choice is left alone.
 */
describe('Character reaction', () => {
  it('replays every time the pulse changes, so repeated clicks pop again', () => {
    const props = { character: 'Explosion', color: 'Mint', size: 'Small' } as const;
    const root = stage();
    render(<Character {...props} pulse={1} />, root);
    const first = popOf(root);

    render(<Character {...props} pulse={2} />, root);
    const second = popOf(root);
    expect(second).not.toBe(first);

    render(<Character {...props} pulse={3} />, root);
    expect(popOf(root)).not.toBe(second);
  });

  it('keeps the same element when the roster re-renders with the same look', () => {
    // The roster re-renders whenever anyone joins, so if the pop restarted on
    // every render then every player would pop whenever anyone else did.
    const props = { character: 'Explosion', color: 'Mint', size: 'Small' } as const;
    const root = stage();
    render(<Character {...props} />, root);
    const before = popOf(root);

    for (let i = 0; i < 5; i++) {
      render(<Character {...props} />, root);
      expect(popOf(root)).toBe(before);
    }
  });

  it('writes its index for the ripple, and defaults to the front of the wave', () => {
    const indexOf = (root: HTMLElement) =>
      /--Pop-Index:\s*(-?\d+)/.exec(popOf(root)?.getAttribute('style') ?? '')?.[1];
    expect(indexOf(mount({ character: 'Butterfly', color: 'Coral', index: 3 }))).toBe('3');
    expect(indexOf(mount({ character: 'Butterfly', color: 'Coral' }))).toBe('0');
  });
});

/**
 * The pop must never scale the character away. A version that grew from zero width
 * looked fine in the picker but flashed every small character in the roster to
 * nothing, which read as a rendering fault rather than as an arrival. There is one
 * keyframe, `PopSquash`, and it only ever touches the height; the stylesheet says
 * why. That is asserted by reading the stylesheet, which the test runner rewrites
 * to an empty module, so it is left to the stylesheet and its own comment.
 */
describe('The pop element', () => {
  it('wraps the character in exactly one element, whatever reacted', () => {
    // Two nested pops would each restart the other, so there is only ever one.
    const root = mount({ character: 'Butterfly', color: 'Coral' });
    const pop = popOf(root);
    expect(pop).not.toBeNull();
    expect(pop?.querySelectorAll('span').length).toBe(0);
  });
});

describe('Character element identity', () => {
  it('keeps the same element when nothing relevant changed', () => {
    const props = { character: 'Explosion', color: 'Mint', size: 'Small' } as const;
    const root = stage();
    render(<Character {...props} />, root);
    const before = popOf(root);

    render(<Character {...props} />, root);
    expect(popOf(root)).toBe(before);
  });

  it('swaps the artwork when the character changes', () => {
    const props = { character: 'Butterfly', color: 'Coral' } as const;
    const root = stage();
    render(<Character {...props} />, root);
    const firstPath = root.querySelector('path')?.getAttribute('d');

    render(<Character character="Ghost" color="Coral" />, root);
    expect(root.querySelector('path')?.getAttribute('d')).not.toBe(firstPath);
  });
});

/**
 * The per-character values are what make a row of characters feel like nine
 * people arriving rather than one animation played nine times.
 */
describe('Character pop values', () => {
  it('writes the values the pop is driven by', () => {
    const style = styleOf(mount({ character: 'Butterfly', color: 'Coral' }));
    // A cocked angle, an offset it arrives from, and a stepped timing.
    expect(style).toMatch(/--Pop-Tilt:\s*-?[\d.]+deg/);
    expect(style).toMatch(/--Pop-OffsetX:\s*-?[\d.]+px/);
    expect(style).toMatch(/--Pop-Timing:\s*steps\(\d+, jump-/);
  });

  it('always arrives from above, so a character reads as dropping into place', () => {
    // The vertical offset is negative by construction, not by luck, so a row of
    // characters never surfaces upward from below.
    for (let i = 0; i < 8; i++) {
      const style = styleOf(mount({ character: 'Butterfly', color: 'Coral' }));
      const y = /--Pop-OffsetY:\s*(-?[\d.]+)px/.exec(style)?.[1];
      expect(y).toBeDefined();
      expect(Number(y)).toBeLessThan(0);
    }
  });
});
