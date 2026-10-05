// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { Wordmark } from './Wordmark';

/** Mount a wordmark, flushing the effect that writes its rolled values. */
function mount(): HTMLElement {
  const root = document.createElement('div');
  document.body.appendChild(root);
  act(() => {
    render(<Wordmark label="Нестандартненько" />, root);
  });
  return root;
}

/** The custom properties a mounted wordmark carries on its root. */
function styleOf(root: HTMLElement): string {
  return root.firstElementChild?.getAttribute('style') ?? '';
}

/** The mark wears the characters' idle sway, so the name and the cast move as one thing. This
 * checks the mechanism rather than the pixels: the values are what make the movement varied,
 * and they are written from JavaScript onto a node, so a change that stopped writing them would
 * leave a wordmark that is present, correctly coloured, and perfectly still — and nothing else
 * in the suite would notice. */
describe('the wordmark sway', () => {
  it('carries the values the sway is driven by', () => {
    const style = styleOf(mount());
    expect(style).toMatch(/--Sway-Tilt:\s*-?[\d.]+deg/);
    expect(style).toMatch(/--Sway-Sway:\s*-?[\d.]+px/);
    expect(style).toMatch(/--Sway-Duration:\s*[\d.]+s/);
    // The step count and the keyword travel as one finished `steps()` call, because
    // the build strips a `var()` inside the function and an invalid timing cancels the
    // animation outright rather than falling back to something visible.
    expect(style).toMatch(/--Sway-Timing:\s*steps\(\d+, jump-/);
  });

  it('rolls its own, so two wordmarks are not one movement played twice', () => {
    // The characters are only interesting because no two agree, and the mark is on
    // the same page as the cast. It has to bring its own values rather than share a
    // set, or a lobby and a name would swing in lockstep across the screen.
    const seen = new Set<string>();
    for (let i = 0; i < 8; i++) {
      seen.add(/--Sway-Sway:\s*-?[\d.]+px/.exec(styleOf(mount()))?.[0] ?? '');
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('keeps its own values when it re-renders', () => {
    // The entry screen re-renders on every keystroke in the name field. A roll taken
    // per render would restart the cycle on each one and the mark would twitch while
    // somebody typed.
    const root = mount();
    const first = styleOf(root);
    for (let i = 0; i < 5; i++) {
      render(<Wordmark label="Нестандартненько" />, root);
      expect(styleOf(root)).toBe(first);
    }
  });

  it('still names the game in the page text', () => {
    // The drawing is hidden from assistive technology, so the hidden span is the only
    // thing naming the game. Without it the join screen would show the mark and say
    // nothing.
    expect(mount().textContent ?? '').toContain('Нестандартненько');
  });
});