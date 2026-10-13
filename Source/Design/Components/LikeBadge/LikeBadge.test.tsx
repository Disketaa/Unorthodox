// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'preact';

const playSound = vi.fn();

vi.mock('../../Sounds', () => ({ playSound }));

const { LikeBadge } = await import('./LikeBadge');

beforeEach(() => {
  playSound.mockClear();
});

function renderBadge(props: Partial<Parameters<typeof LikeBadge>[0]> = {}) {
  const root = document.createElement('div');
  document.body.appendChild(root);
  render(
    <LikeBadge count={0} liked={false} label="0 likes" onToggle={() => {}} {...props} />,
    root
  );
  return root;
}

describe('a like badge', () => {
  it('puts the mark and the count inside the button, not beside it', () => {
    // A count drawn next to the badge is a number the room reads without pressing anything, and a
    // badge whose number is outside it is two things where the room is shown one.
    const button = renderBadge({ count: 3 }).querySelector('button');
    expect(button?.textContent).toBe('3');
    expect(button?.querySelectorAll('span').length).toBe(2);
  });

  it('is a button where the player may press it', () => {
    const button = renderBadge().querySelector('button');
    button?.click();
    expect(playSound).toHaveBeenCalledTimes(1);
  });

  it('is a plain figure where they may not, and still shows the count', () => {
    // Somebody's own answer: shown what the room thought of it, with nothing to press. The
    // refused cursor is on it in the stylesheet; what matters here is that it is not a control.
    const root = renderBadge({ count: 2, onToggle: undefined });
    expect(root.querySelector('button')).toBeNull();
    expect(root.textContent).toBe('2');
  });

  it('sounds a pling an octave up rather than a pop', () => {
    // A like is not a mute: a mute takes an answer off the board and this only says the room liked
    // it, so it has to be a different note from the one the other press makes.
    renderBadge().querySelector('button')?.click();
    expect(playSound).toHaveBeenCalledWith('Pling', 12);
  });

  it('says the count out loud, from the layer that owns the words', () => {
    // Passed in rather than composed here, since this component knows nothing of the room's
    // language: a badge that read English on a Russian board would be worse than a silent one.
    expect(
      renderBadge({ count: 4, label: '4 лайка' })
        .querySelector('button')
        ?.getAttribute('aria-label')
    ).toBe('4 лайка');
  });

  it('reads as pressed when this player is one of those who liked it', () => {
    expect(
      renderBadge({ liked: true }).querySelector('button')?.getAttribute('aria-pressed')
    ).toBe('true');
    expect(renderBadge().querySelector('button')?.getAttribute('aria-pressed')).toBe('false');
  });

  it('is held back at nothing and not held back once there is one', () => {
    // The class is the only thing that tells them apart: a badge missing entirely would be a
    // badge the room stops looking for, and one never held back would make every card shout.
    const empty = renderBadge({ count: 0 }).querySelector('button')?.className ?? '';
    const liked = renderBadge({ count: 1 }).querySelector('button')?.className ?? '';
    expect(empty).not.toBe(liked);
  });
});
