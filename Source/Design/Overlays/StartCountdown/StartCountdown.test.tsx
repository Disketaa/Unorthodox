// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { StartCountdown } from './StartCountdown';

function mount(props: { veiling: boolean; count: number | null }): HTMLElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    render(<StartCountdown {...props} />, container);
  });
  return container;
}

/** The number on screen, or null if the layer is showing no number. */
function shownNumber(container: HTMLElement): string | null {
  const text = container.textContent?.trim() ?? '';
  return /^[0-9]+$/.test(text) ? text : null;
}

/** Re-render the same layer on a new count, the way the room counts on. */
function count(container: HTMLElement, next: number | null, veiling = false): void {
  act(() => {
    render(<StartCountdown veiling={veiling} count={next} />, container);
  });
}

describe('the count-in', () => {
  it('shows the number it is given', () => {
    expect(shownNumber(mount({ veiling: false, count: 2 }))).toBe('2');
  });

  it('shows the shade with no number before the count begins', () => {
    const container = mount({ veiling: true, count: null });
    expect(shownNumber(container)).toBeNull();
    expect(container.firstElementChild?.childElementCount).toBe(1);
  });

  it('shows nothing at all when there is no count-in', () => {
    expect(mount({ veiling: false, count: null }).textContent).toBe('');
  });

  it('mounts each number fresh, so its pop runs again and its sway is its own', () => {
    // One element whose text changed would keep the first number's lean, tempo and
    // place in the cycle, and its pop would be on its first run for the rest of the
    // count: three identical numbers rather than three numbers.
    const container = mount({ veiling: false, count: 3 });
    const first = container.firstElementChild?.lastElementChild;
    count(container, 2);
    expect(container.firstElementChild?.lastElementChild).not.toBe(first);
  });

  it('swings inside the pop rather than instead of it', () => {
    // Two elements because an element holds one `animation`: the wrapper carries the
    // sway's transform and the number inside it carries the pop. On one element the
    // second declaration would replace the first and the number would only do one.
    const container = mount({ veiling: false, count: 3 });
    const wrapper = container.firstElementChild?.lastElementChild;
    expect(wrapper?.firstElementChild).not.toBe(wrapper);
    expect(wrapper?.firstElementChild?.className).toBeTruthy();
  });

  it('leaves by being taken away, rather than by fading out', () => {
    // The writing screen arrives on the page's own fade, and a fade here would be a
    // second movement racing that one rather than the hand-off being it.
    const container = mount({ veiling: false, count: 1 });
    count(container, null);
    expect(container.textContent).toBe('');
  });
});
