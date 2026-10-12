// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { AnswerCard } from './AnswerCard';

/** A card as the browser sees it, mounted into a page of its own, and the page it is on. */
function mount(props: {
  count?: number;
  voted?: boolean;
  blank?: boolean;
  onReject?: () => void;
}): { card: Element; page: HTMLElement } {
  const page = document.body.appendChild(document.createElement('div'));
  act(() => {
    render(
      <AnswerCard
        text="an answer"
        count={props.count ?? 1}
        voted={props.voted}
        blank={props.blank}
        onReject={props.onReject}
      />,
      page
    );
  });
  const card = page.firstElementChild;
  if (card === null) throw new Error('no card rendered');
  return { card, page };
}

describe('an answer card', () => {
  it('leaves the count off a card only one player wrote', () => {
    // A figure of one behind every unique answer is a number that says nothing, and unique
    // answers are the common case rather than the exception.
    expect(mount({ count: 1 }).card.querySelector('[class*=Mark]')).toBeNull();
  });

  it('draws the count where more than one player wrote the same thing', () => {
    // This is the whole of what a duplicate is on the board, so the card is where it is shown.
    expect(mount({ count: 3 }).card.querySelector('[class*=Mark]')?.textContent).toBe('3');
  });

  it('is a control while the room is being asked about it', () => {
    const { card } = mount({ onReject: () => {} });
    expect(card.tagName).toBe('BUTTON');
    expect(card.getAttribute('aria-pressed')).toBe('false');
    expect(card.className).not.toContain('Record');
  });

  it('says so when the vote is in, and stops answering the pointer', () => {
    const { card } = mount({ voted: true, onReject: () => {} });
    expect(card.getAttribute('aria-pressed')).toBe('true');
    expect(card.className).toContain('Voted');
  });

  it('reports a press, so the board can say which answer was voted out', () => {
    let presses = 0;
    const { page } = mount({ onReject: () => (presses += 1) });
    const button = page.querySelector('button');
    if (button === null) throw new Error('no button rendered');
    act(() => {
      button.click();
    });
    expect(presses).toBe(1);
  });

  it('is not a control at all where nobody may vote on it', () => {
    // Not a disabled button: a disabled control is still focusable and still announced as a
    // button, so a card the room can press and that does nothing is worse than a card that is
    // plainly a picture of an answer.
    const { card } = mount({});
    expect(card.tagName).not.toBe('BUTTON');
    expect(card.className).toContain('Record');
    expect(card.hasAttribute('aria-pressed')).toBe(false);
  });

  it('holds a blank back to the quietness of a theme card with nothing left', () => {
    // Same word, same board, one thing that is not on offer.
    expect(mount({ blank: true }).card.className).toContain('Blank');
  });
});
