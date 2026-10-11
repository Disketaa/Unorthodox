// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { useFullscreen } from './UseFullscreen';

/** Stands in for the two calls the browser exposes, and records what was asked of them.
 * happy-dom has neither, and neither has anything that is not a browser. */
function poseFullscreen(element: Element | null): string[] {
  const asked: string[] = [];
  Object.defineProperty(document, 'fullscreenElement', {
    configurable: true,
    get: () => element,
  });
  Object.defineProperty(document.documentElement, 'requestFullscreen', {
    configurable: true,
    value: () => {
      asked.push('enter');
      return Promise.resolve();
    },
  });
  Object.defineProperty(document, 'exitFullscreen', {
    configurable: true,
    value: () => {
      asked.push('leave');
      return Promise.resolve();
    },
  });
  return asked;
}

afterEach(() => {
  Reflect.deleteProperty(document, 'fullscreenElement');
  Reflect.deleteProperty(document.documentElement, 'requestFullscreen');
  Reflect.deleteProperty(document, 'exitFullscreen');
});

/** The hook's latest reading, driven the way the button drives it. */
function fullscreen() {
  const seen: { isFullscreen: boolean }[] = [];
  function Probe() {
    const state = useFullscreen();
    seen.push({ isFullscreen: state.isFullscreen });
    return (
      <button type="button" onClick={() => state.onToggleFullscreen()}>
        toggle
      </button>
    );
  }
  const root = document.createElement('div');
  document.body.appendChild(root);
  return {
    latest: () => seen[seen.length - 1],
    async open() {
      await act(async () => {
        render(<Probe />, root);
      });
    },
    async press() {
      await act(async () => {
        root.querySelector('button')?.click();
      });
    },
    // The browser reporting a change of its own, which is what Esc and F11 do.
    change() {
      act(() => {
        document.dispatchEvent(new Event('fullscreenchange'));
      });
    },
  };
}

describe('the fullscreen control', () => {
  it('starts as the window is, which is not full', async () => {
    poseFullscreen(null);
    const control = fullscreen();
    await control.open();
    expect(control.latest().isFullscreen).toBe(false);
  });

  it('asks the window to fill on the first press', async () => {
    const asked = poseFullscreen(null);
    const control = fullscreen();
    await control.open();
    await control.press();
    expect(asked).toEqual(['enter']);
  });

  it('asks the window back on the next press', async () => {
    const asked = poseFullscreen(document.documentElement);
    const control = fullscreen();
    await control.open();
    await control.press();
    expect(asked).toEqual(['leave']);
  });

  it('follows the browser when it leaves fullscreen on its own', async () => {
    poseFullscreen(document.documentElement);
    const control = fullscreen();
    await control.open();
    expect(control.latest().isFullscreen).toBe(true);
    poseFullscreen(null);
    control.change();
    expect(control.latest().isFullscreen).toBe(false);
  });

  it('does nothing where there is no fullscreen at all', async () => {
    const control = fullscreen();
    await control.open();
    await control.press();
    expect(control.latest().isFullscreen).toBe(false);
  });
});
