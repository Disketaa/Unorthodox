// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'preact';

const playSound = vi.fn();

vi.mock('../../Sounds', () => ({ playSound }));

const { AnswerCard } = await import('./AnswerCard');

beforeEach(() => {
  playSound.mockClear();
});

/** A card on a root of its own, and the element it drew as. The answer and its count are the
 * card's own two required props, so a test that is not about them does not have to pass them. */
function renderCard(props: Partial<Parameters<typeof AnswerCard>[0]> = {}): HTMLElement {
  const root = document.createElement('div');
  document.body.appendChild(root);
  render(<AnswerCard text="кот" count={1} {...props} />, root);
  const card = root.firstElementChild;
  if (!(card instanceof HTMLElement)) throw new Error('no card rendered');
  return card;
}

describe('an answer card', () => {
  it('pops when it is pressed, as a theme card does', () => {
    // The same note a press on the bank makes, since this is the same kind of press: the host
    // deciding something about a card. A board that answers silently and a bank that does not is
    // two controls doing one job.
    renderCard({ onReject: vi.fn() }).click();
    expect(playSound).toHaveBeenCalledWith('Pop');
  });

  it('pops once per press, taking a mute back included', () => {
    const onReject = vi.fn();
    const card = renderCard({ onReject });
    card.click();
    card.click();
    expect(playSound).toHaveBeenCalledTimes(2);
    expect(onReject).toHaveBeenCalledTimes(2);
  });

  it('stays quiet where there is nothing to press', () => {
    // Every screen but the host's draws the board as a record, and a card that cannot be muted
    // must not sound as though it could be.
    renderCard({}).click();
    expect(playSound).not.toHaveBeenCalled();
  });

  it('plays the sound before it runs the click', () => {
    // The sound belongs to the press rather than to the mute having landed: it has to be heard
    // with the finger going down, not once the room has been told.
    const order: string[] = [];
    playSound.mockImplementation(() => {
      order.push('sound');
    });
    const onReject = vi.fn(() => {
      order.push('click');
    });
    renderCard({ onReject }).click();
    expect(order).toEqual(['sound', 'click']);
  });
});
