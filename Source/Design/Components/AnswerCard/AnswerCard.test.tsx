// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'preact';

const playSound = vi.fn();

vi.mock('../../Sounds', () => ({ playSound }));

const { AnswerCard } = await import('./AnswerCard');

beforeEach(() => {
  playSound.mockClear();
});

/** A card on a root of its own, and the root it drew into. The answer and its count are the
 * card's own two required props, so a test that is not about them does not have to pass them. */
function renderCard(props: Partial<Parameters<typeof AnswerCard>[0]> = {}) {
  const root = document.createElement('div');
  document.body.appendChild(root);
  render(<AnswerCard text="кот" count={1} {...props} />, root);
  return root;
}

describe('an answer card', () => {
  it('is a container rather than a button, since it now carries two controls', () => {
    // A button inside a button is not a button, and a mute laid over the whole card with a like in
    // its corner is two controls. The card is the box they both sit in.
    const root = renderCard({ onReject: () => {}, onLike: () => {} });
    expect(root.firstElementChild?.tagName).toBe('DIV');
    expect(root.querySelectorAll('button').length).toBe(2);
  });

  it('pops when the mute is pressed, as a theme card does', () => {
    // The same note a press on the bank makes, since this is the same kind of press. A board that
    // answers silently and a bank that does not is two controls doing one job.
    const mute = renderCard({ onReject: () => {} }).querySelector('button');
    mute?.click();
    expect(playSound).toHaveBeenCalledWith('Pop');
  });

  it('pops once per press, taking a mute back included', () => {
    const onReject = vi.fn();
    const mute = renderCard({ onReject }).querySelector('button');
    mute?.click();
    mute?.click();
    expect(playSound).toHaveBeenCalledTimes(2);
    expect(onReject).toHaveBeenCalledTimes(2);
  });

  it('plays the sound before it runs the mute', () => {
    // The sound belongs to the press rather than to the mute having landed: it has to be heard
    // with the finger going down, not once the room has been told.
    const order: string[] = [];
    playSound.mockImplementation(() => {
      order.push('sound');
    });
    const onReject = vi.fn(() => {
      order.push('click');
    });
    renderCard({ onReject }).querySelector('button')?.click();
    expect(order).toEqual(['sound', 'click']);
  });

  it('draws a badge but no controls where there is nothing to press', () => {
    // Every screen but the host's draws the board as a record, and a player is shown the count on
    // their own answer without being offered anything to do about it.
    const root = renderCard({ onReject: undefined });
    expect(root.querySelectorAll('button').length).toBe(0);
    expect(root.textContent).toContain('0');
  });

  it('draws the badge in the corner of the card rather than in the flow of the answer', () => {
    // In the flow it would push the answer about as the count grows, and a card whose text moves
    // when somebody likes it is a card nobody can read while they are being read to.
    const corner = renderCard({ onReject: () => {}, onLike: () => {} }).querySelector(
      'button + span'
    );
    expect(corner?.tagName).toBe('SPAN');
    expect(corner?.textContent).toBe('0');
  });
});
