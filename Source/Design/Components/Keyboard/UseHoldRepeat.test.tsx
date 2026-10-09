// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'preact';
import { HoldDelayMs, HoldRepeatMs } from './UseHoldRepeat';

/** A key that repeats, wired the way the keyboard wires one: the hook's listeners on a button,
 * with the press counted the way the keyboard counts it. */
const { Key } = await import('./KeyboardKey');

beforeEach(() => {
  vi.useFakeTimers();
  // happy-dom has no pointer capture, and a browser without it would drop the release.
  HTMLElement.prototype.setPointerCapture = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
});

function renderKey(onKeyPress: (key: string) => void, repeats = true): HTMLButtonElement {
  const root = document.createElement('div');
  document.body.appendChild(root);
  render(
    <Key
      keyName="Backspace"
      pressCount={0}
      disabled={false}
      repeats={repeats}
      onKeyPress={onKeyPress}
    />,
    root
  );
  const button = root.querySelector<HTMLButtonElement>('button');
  if (!button) throw new Error('no key rendered');
  return button;
}

/** A finger going down and staying down, which is what a hold is. */
function hold(button: HTMLButtonElement): void {
  button.dispatchEvent(
    Object.assign(new Event('pointerdown', { bubbles: true }), { pointerId: 1 })
  );
}

function release(button: HTMLButtonElement): void {
  button.dispatchEvent(new Event('pointerup', { bubbles: true }));
}

describe('a held key', () => {
  it('fires once on a tap, and not again while the finger is still down', () => {
    const onKeyPress = vi.fn();
    const button = renderKey(onKeyPress);

    button.click();
    vi.advanceTimersByTime(HoldDelayMs + HoldRepeatMs * 3);

    expect(onKeyPress).toHaveBeenCalledTimes(1);
  });

  it('keeps firing while it is held, at the repeat rate rather than all at once', () => {
    const onKeyPress = vi.fn();
    const button = renderKey(onKeyPress);

    hold(button);
    vi.advanceTimersByTime(HoldDelayMs - 1);
    expect(onKeyPress).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onKeyPress).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(HoldRepeatMs * 3);
    expect(onKeyPress).toHaveBeenCalledTimes(4);
  });

  it('stops the moment the finger lifts', () => {
    const onKeyPress = vi.fn();
    const button = renderKey(onKeyPress);

    hold(button);
    vi.advanceTimersByTime(HoldDelayMs + HoldRepeatMs * 2);
    release(button);
    vi.advanceTimersByTime(HoldRepeatMs * 10);

    expect(onKeyPress).toHaveBeenCalledTimes(3);
  });

  it('counts a hold as one press, so the click that follows it does not fire twice', () => {
    const onKeyPress = vi.fn();
    const button = renderKey(onKeyPress);

    hold(button);
    vi.advanceTimersByTime(HoldDelayMs + HoldRepeatMs);
    release(button);
    button.click();

    expect(onKeyPress).toHaveBeenCalledTimes(2);
  });

  it('keeps repeating while the key is remounted by a press, which is what a pop does', () => {
    // The pop restarts by re-rendering the key, and a key rebuilt on every press used to take
    // the hold timer with it: the first press landed and then the key went quiet.
    const onKeyPress = vi.fn();
    const root = document.createElement('div');
    document.body.appendChild(root);
    const press = (count: number) => (
      <Key keyName="Backspace" pressCount={count} disabled={false} onKeyPress={onKeyPress} />
    );
    render(press(0), root);
    const button = root.querySelector<HTMLButtonElement>('button');
    if (!button) throw new Error('no key rendered');

    hold(button);
    vi.advanceTimersByTime(HoldDelayMs);
    expect(onKeyPress).toHaveBeenCalledTimes(1);

    // What the keyboard does on every press: the same key, counted once more.
    render(press(1), root);
    vi.advanceTimersByTime(HoldRepeatMs * 3);

    expect(onKeyPress).toHaveBeenCalledTimes(4);
  });

  it('does not repeat a key that is not meant to', () => {
    const onKeyPress = vi.fn();
    const button = renderKey(onKeyPress, false);

    hold(button);
    vi.advanceTimersByTime(HoldDelayMs + HoldRepeatMs * 5);

    expect(onKeyPress).not.toHaveBeenCalled();
  });
});
