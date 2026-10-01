// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'preact';
import { PageFadeClass, usePageEnter } from './UsePageEnter';

/** A stand-in for a screen: the fade and nothing else, so the test is about the fade. */
function Page() {
  usePageEnter();
  return null;
}

/** Put a screen on the page, on a root of its own. */
function showPage(): void {
  const root = document.createElement('div');
  document.body.appendChild(root);
  render(<Page />, root);
}

/** Render into one root a set of times, and report how often the body's class changed. */
function classChangesWhile(renders: number): number {
  const root = document.createElement('div');
  document.body.appendChild(root);
  render(<Page />, root);
  let changes = 0;
  const observer = new MutationObserver((records) => {
    changes += records.length;
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  for (let pass = 0; pass < renders; pass += 1) {
    render(<Page />, root);
  }
  observer.disconnect();
  return changes;
}

describe('usePageEnter', () => {
  afterEach(() => {
    document.body.className = '';
    document.body.innerHTML = '';
  });

  it('fades the first screen in as well', () => {
    // The refresh case: the very first page must fade, so the class is applied
    // here and not only from the second screen on.
    showPage();
    expect(document.body.classList.contains(PageFadeClass)).toBe(true);
  });

  it('applies the class while rendering, before the browser can paint the screen', () => {
    // The blink this replaced: the class arrived in an effect, so the browser
    // painted the new page fully lit and only then took it back to nothing. The
    // class has to be on the body by the time rendering returns.
    const painted: boolean[] = [];
    const Probe = () => {
      usePageEnter();
      painted.push(document.body.classList.contains(PageFadeClass));
      return null;
    };
    const root = document.createElement('div');
    document.body.appendChild(root);
    render(<Probe />, root);
    expect(painted).toEqual([true]);
  });

  it('re-applies the class on a later screen, so the animation runs again', () => {
    showPage();
    // An animation runs only when its name is newly applied, and a class left on
    // the body would leave every page after the first one lit.
    showPage();
    expect(document.body.classList.contains(PageFadeClass)).toBe(true);
  });

  it('does not re-fade a screen that re-renders in place', () => {
    // A screen re-renders as often as its data changes, and a fade on each of
    // those would have the page pulsing under the player's hands.
    expect(classChangesWhile(2)).toBe(0);
  });

  it('names the class the stylesheet animates', () => {
    // The class is a string on both sides of a module boundary, so it is spelled
    // out here rather than left to whoever edits either side next.
    expect(PageFadeClass).toBe('PageFade');
  });
});
