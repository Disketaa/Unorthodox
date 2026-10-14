// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'preact';

const playSound = vi.fn();

vi.mock('../../Sounds', () => ({ playSound }));

const { Pop } = await import('./Pop');

beforeEach(() => {
  vi.useRealTimers();
});

describe('a pop with a sound of its own', () => {
  it('fires once per landing, however often the caller re-renders', () => {
    // The bug this is here for: the sound was read out of a closure, so the ref callback that
    // sets the timing ran again every time the caller's callback changed identity — which it did
    // on every render, being an inline arrow in a map. Each run put another timer on the node, so
    // one landing became a timer that fired, rendered, and queued itself again. The page froze.
    const onStart = vi.fn();
    const root = document.createElement('div');
    document.body.appendChild(root);
    render(
      <Pop trigger="a" delay="0ms" onStart={onStart}>
        <span>badge</span>
      </Pop>,
      root
    );
    expect(onStart).toHaveBeenCalledTimes(1);

    // A fresh inline arrow each time, which is what a `.map` hands over.
    for (let rerender = 0; rerender < 5; rerender += 1) {
      render(
        <Pop trigger="a" delay="0ms" onStart={() => onStart()}>
          <span>badge</span>
        </Pop>,
        root
      );
    }
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('does not fire again when only the trigger moves, and then does', () => {
    // A badge landing is a change of what it is showing, not a change of when it landed: the
    // sound belongs to the landing.
    const onStart = vi.fn();
    const root = document.createElement('div');
    document.body.appendChild(root);
    const at = (trigger: string) =>
      render(
        <Pop trigger={trigger} delay="0ms" onStart={onStart}>
          <span>badge</span>
        </Pop>,
        root
      );
    at('a');
    expect(onStart).toHaveBeenCalledTimes(1);
    at('b');
    expect(onStart).toHaveBeenCalledTimes(2);
  });

  it('waits its delay before firing, and fires once when it gets there', () => {
    vi.useFakeTimers();
    const onStart = vi.fn();
    const root = document.createElement('div');
    document.body.appendChild(root);
    render(
      <Pop trigger="a" delay="760ms" onStart={onStart}>
        <span>badge</span>
      </Pop>,
      root
    );
    expect(onStart).not.toHaveBeenCalled();
    vi.advanceTimersByTime(759);
    expect(onStart).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2);
    expect(onStart).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(10000);
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('says nothing at all once the badge is gone', () => {
    // A sound firing after its badge has left is a sound with nothing on the screen behind it.
    vi.useFakeTimers();
    const onStart = vi.fn();
    const root = document.createElement('div');
    document.body.appendChild(root);
    render(
      <Pop trigger="a" delay="760ms" onStart={onStart}>
        <span>badge</span>
      </Pop>,
      root
    );
    render(<div />, root);
    vi.advanceTimersByTime(5000);
    expect(onStart).not.toHaveBeenCalled();
  });
});
