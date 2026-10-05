// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { RoundMeter } from './RoundMeter';

/** The bar as one role sees it: its ticks, and which of them are spent. */
function bar(spent?: number, rounds = 10) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    render(<RoundMeter rounds={rounds} spent={spent} />, container);
  });
  const root = container.firstElementChild;
  if (root === null) {
    throw new Error('no bar rendered');
  }
  const ticks = [...root.querySelectorAll('span')];
  const isSpent = (tick: Element) => (tick.getAttribute('class') ?? '').includes('Spent');
  return { root, ticks, spentAt: ticks.map((tick, at) => (isSpent(tick) ? at : -1)) };
}

describe('the health bar on a theme card', () => {
  it('draws one tick per round of the theme', () => {
    // The number of topics the theme answers for, and the length of the bar: a card showing
    // fewer ticks than the theme has rounds says the theme is shorter than it is.
    expect(bar(0).ticks).toHaveLength(10);
    expect(bar(0, 3).ticks).toHaveLength(3);
  });

  it('is full before anything is played', () => {
    // A theme nobody has chosen yet has all of its rounds, and choosing it is what spends the
    // first one. A bar that started greyed would say the theme had already been asked things.
    expect(bar().spentAt.every((at) => at === -1)).toBe(true);
    expect(bar(0).spentAt.every((at) => at === -1)).toBe(true);
  });

  it('empties from the right, so the spent ticks are the last ones', () => {
    // The row is a bar that drains rather than one that fills: choosing a theme spends one
    // tick and it goes at the right end, which is where the eye reads a draining bar from.
    expect(bar(1).spentAt).toEqual([-1, -1, -1, -1, -1, -1, -1, -1, -1, 9]);
    expect(bar(3).spentAt).toEqual([-1, -1, -1, -1, -1, -1, -1, 7, 8, 9]);
  });

  it('empties one tick per round rather than a fraction of the bar', () => {
    // Ticks rather than one continuous fill: a fill would move by a twentieth of itself per
    // round instead of by a whole segment, and ten of them also say how many rounds a theme
    // had in total.
    expect(bar(1).spentAt.filter((at) => at >= 0)).toHaveLength(1);
    expect(bar(9).spentAt.filter((at) => at >= 0)).toHaveLength(9);
  });

  it('keeps drawing the spent ticks rather than shortening the bar', () => {
    // A spent round is still a round this theme had, and a bar that hid them would say the
    // theme was never as long as it was. What is spent is drawn, not deleted.
    expect(bar(9).ticks).toHaveLength(10);
  });

  it('says nothing at all to a screen reader', () => {
    // Ten ticks read out as a burst of punctuation, and the ticks that matter are the grey
    // ones, which a screen reader cannot see. The card's name is what is announced.
    expect(bar(4).root.getAttribute('aria-hidden')).toBe('true');
    expect(bar(4).root.textContent).toBe('');
  });
});
