// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { AnswerCards, type AnswerCardsEntry } from './AnswerCards';
import { flyOutDelayMs, scoreCountMs } from '../ScoreTiming';

/** A board of `count` answers, all different, and nothing voted out. */
function answers(count: number): AnswerCardsEntry[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    text: `answer ${id}`,
    count: 1,
    voted: false,
    likeLabel: '0 likes',
  }));
}

/** The cards on a board, read down through the slot and the arrival each is wrapped in: a card
 * is a button only where it can be voted on, so counting buttons would count the room's presses
 * rather than the room's answers. */
function cardsOf(root: Element): Element[] {
  return [...root.children]
    .filter((slot) => slot.firstElementChild !== null)
    .flatMap((slot) => [...slot.children].flatMap((pop) => [...pop.children]));
}

/** Mount a board and hand back the cards as the browser sees them, with the class of the board
 * they are in: happy-dom does not lay out a grid, so the class is the arrangement. */
function mount(
  count: number,
  onReject?: (id: number) => void
): { cards: Element[]; root: Element } {
  const container = document.body.appendChild(document.createElement('div'));
  act(() => {
    render(<AnswerCards answers={answers(count)} onReject={onReject} />, container);
  });
  const root = container.firstElementChild;
  if (root === null) throw new Error('no board rendered');
  return { cards: cardsOf(root), root };
}

/** The empty cells on a board, which are the cells holding no answer. */
function fillersOf(root: Element): number {
  return [...root.children].filter((cell) => cell.firstElementChild === null).length;
}

/** Mount a board with the count standing on one card, and hand back the board itself: the cells
 * are what the count moves over, so the class of a cell is what the room is shown. */
function mountPaying(count: number, payingIndex: number, payingElapsedMs?: number): Element {
  const container = document.body.appendChild(document.createElement('div'));
  act(() => {
    render(
      <AnswerCards
        answers={answers(count)}
        payingIndex={payingIndex}
        payingElapsedMs={payingElapsedMs}
        spotlight
      />,
      container
    );
  });
  const root = container.firstElementChild;
  if (root === null) throw new Error('no board rendered');
  return root;
}

/** The cells of a board, in the order they are drawn: the veil over a counting board is not a
 * cell, and neither is the empty cell that holds the place of one the last row is short by. */
function slotsOf(root: Element): Element[] {
  return [...root.children].filter((cell) => cell.firstElementChild !== null);
}

describe('a card the count has been through', () => {
  it('is on its way off the board, and the card being counted is not', () => {
    // The count walks the board one card at a time, and a card it has been through is a card
    // that leaves: the board is read as a pile of sheets taken off one at a time, not as a board
    // holding every answer it has ever read.
    const slots = slotsOf(mountPaying(3, 1));
    expect(slots[0]?.className).toContain('Fleeing');
    expect(slots[1]?.className).not.toContain('Fleeing');
    expect(slots[2]?.className).not.toContain('Fleeing');
  });

  it('holds the card while its figure is still counting', () => {
    // The card is being read while its figure climbs, and a card that left in the middle of the
    // climb would be a card taken away before the room had been told what it was worth.
    const counting = slotsOf(mountPaying(2, 0, scoreCountMs() - 1));
    expect(counting[0]?.className).not.toContain('Fleeing');
  });

  it('leaves a beat after the figure lands, so the room has read it first', () => {
    // The card is held for a moment once its figure has landed, and the note that says what it
    // paid waits the same beat: the sound and the card leaving are one moment, and neither of
    // them comes before the room has had the figure.
    const held = slotsOf(mountPaying(2, 0, scoreCountMs() + flyOutDelayMs() - 1));
    expect(held[0]?.className).not.toContain('Fleeing');
    const leaving = slotsOf(mountPaying(2, 0, scoreCountMs() + flyOutDelayMs()));
    expect(leaving[0]?.className).toContain('Fleeing');
  });

  it('keeps its cell, since the board holds its shape while the round is counted', () => {
    // A board that closed up under the count would move the room's eyes off the card being
    // paid and onto a grid that is being redrawn, which is the one thing the count cannot
    // afford to do.
    const root = mountPaying(3, 2);
    expect(slotsOf(root)).toHaveLength(3);
  });
});

describe('the board of answers', () => {
  it('draws two answers side by side rather than as one column with a gap beside it', () => {
    expect(mount(2).root.className).toContain('Columns2');
  });

  it('draws nine answers three by three', () => {
    // Three columns and three rows, which is the arrangement the whole bank is written for: a
    // nine-answer board with two columns is four rows of two and a row of one.
    expect(mount(9).root.className).toContain('Columns3');
  });

  it('draws twelve answers as the same three columns and one row deeper', () => {
    // Twelve is the most a room holds, so it is the board that has to work at its widest.
    expect(mount(12).root.className).toContain('Columns3');
  });

  it('draws a lone answer on its own', () => {
    expect(mount(1).root.className).toContain('Columns1');
  });

  it('holds every card to the same size, whatever the count is', () => {
    // One board of nine and one of twelve differ in how many rows they have, not in how big a
    // card is: a card sized to its contents is a card the room is reading by eye.
    const nine = mount(9);
    const twelve = mount(12);
    expect(nine.cards).toHaveLength(9);
    expect(twelve.cards).toHaveLength(12);
    expect(nine.cards[0]?.className).toBe(twelve.cards[0]?.className);
  });

  it('centres a row it has fewer answers for than it has columns', () => {
    // Four on three columns is two over one, and the last card belongs under the middle of the
    // row above it rather than hanging off the left edge of the board.
    expect(mount(4).root.className).toContain('Columns3');
    expect(fillersOf(mount(4).root)).toBe(2);
  });

  it('draws no empty cells on a board its columns fill exactly', () => {
    // Three columns take three, six and nine. An empty cell on a full row would be a hole in the
    // middle of the board where a card ought to be.
    for (const count of [3, 6, 9, 12]) {
      expect(fillersOf(mount(count).root)).toBe(0);
    }
  });

  it('fills a row it has more answers for than it has columns, one over', () => {
    // Five on three columns leaves one cell short, not two: a row of two over a row of three is
    // two cards and a hole, and centring it needs the hole after them rather than before.
    expect(fillersOf(mount(5).root)).toBe(1);
  });

  it('leaves a lone answer on its own row without an empty cell beside it', () => {
    expect(fillersOf(mount(1).root)).toBe(0);
  });

  it('gives a blank card no vote, since there is no answer on it to vote out', () => {
    // A vote that moved nothing the room can see is a control the room pressed and nothing
    // happened, so a card standing for a player who wrote nothing is not one.
    const voted: number[] = [];
    const container = document.body.appendChild(document.createElement('div'));
    const blank = {
      ...(answers(1)[0] ?? { id: 0, text: '', count: 1, voted: false }),
      blank: true,
    };
    act(() => {
      render(<AnswerCards answers={[blank]} onReject={(id) => voted.push(id)} />, container);
    });
    expect(container.querySelector('button')).toBeNull();
    expect(voted).toEqual([]);
  });

  it('says which answer was voted out, rather than which cell of the board it is in', () => {
    // Groups arrive and are voted on in whatever order the room pressed them, so the id is the
    // group's own and not its index: an index would vote on the wrong answer after one is taken.
    const voted: number[] = [];
    const container = document.body.appendChild(document.createElement('div'));
    const entries = [answers(2)[1]].filter(
      (entry): entry is AnswerCardsEntry => entry !== undefined
    );
    act(() => {
      render(<AnswerCards answers={entries} onReject={(id) => voted.push(id)} />, container);
    });
    const card = container.querySelector('button');
    if (card === null) throw new Error('no card rendered');
    act(() => {
      card.click();
    });
    expect(voted).toEqual([1]);
  });

  it('draws the board as live cards, whatever control this browser has on it', () => {
    // Whether a card is something to press is a fact about the round, not about which control
    // this browser was handed: a host's card is live the moment it comes up and so is anybody
    // else's, and the difference is which control is lying on top rather than whether one is.
    const { cards } = mount(4);
    expect(cards.every((card) => card.className.includes('Live'))).toBe(true);
  });
});

describe('an answer the host has taken off the board', () => {
  // One muted card and whatever else the board holds, mounted as the host sees it.
  function mutedBoard(
    count: number,
    onLike?: (id: number) => void
  ): { card: Element | null; buttons: number } {
    const container = document.body.appendChild(document.createElement('div'));
    const muted: AnswerCardsEntry = {
      id: 0,
      text: 'the same answer twice',
      count,
      voted: true,
      likeLabel: '0 likes',
    };
    act(() => {
      render(<AnswerCards answers={[muted]} onReject={() => {}} onLike={onLike} />, container);
    });
    return {
      card: container.querySelector('div[class*="Root"]'),
      buttons: container.querySelectorAll('button').length,
    };
  }

  it('keeps a shared answer struck and stops the host taking the mute back', () => {
    // What the room struck out was the thing several of them said. Putting it back would be one
    // host undoing a verdict the room has already been shown as settled, on a card that looks
    // exactly as finished as one that really is.
    const { buttons } = mutedBoard(3);
    expect(buttons).toBe(0);
  });

  it('turns the cursor away on a settled card, since it was a control a moment ago', () => {
    // The plain cursor is what a card that was never a control wears. This one was: somebody
    // reaching for it again should be told why, rather than left to wonder whether the press did
    // nothing or the card did not hear them.
    const container = document.body.appendChild(document.createElement('div'));
    const shared: AnswerCardsEntry = {
      id: 0,
      text: 'the same answer twice',
      count: 3,
      voted: true,
      likeLabel: '0 likes',
    };
    act(() => {
      render(<AnswerCards answers={[shared]} onReject={() => {}} />, container);
    });
    const card = container.querySelector('div[class*="Locked"]');
    expect(card).not.toBeNull();
    expect(card?.className).toContain('Voted');
  });

  it('still lets the host take back a single writer the room struck out', () => {
    // One answer, one person, one opinion about it: the host changes their mind about their own
    // read of it as often as they like, and a mute that could not be undone would be a decision
    // made once with no way back.
    const container = document.body.appendChild(document.createElement('div'));
    const muted: AnswerCardsEntry = {
      id: 0,
      text: 'an answer of their own',
      count: 1,
      voted: true,
      likeLabel: '0 likes',
    };
    act(() => {
      render(<AnswerCards answers={[muted]} onReject={() => {}} />, container);
    });
    expect(container.querySelector('button')).not.toBeNull();
  });

  it('offers a player nothing at all on a card that is off the board', () => {
    // Not even the card itself: the like badge is already gone, so a card that took the press
    // would be the one control on the board that does nothing at all when pressed.
    const { buttons } = mutedBoard(2, () => {});
    expect(buttons).toBe(0);
  });

  it('takes a single writer back off the board, which is the whole point of a mute button', () => {
    // The regression this is here for: the mute was left out of any card that was muted, on the
    // reasoning that a card off the board is not an answered one — which is true, and left every
    // mute in the room with no way back at all. One writer's answer is still one opinion about it.
    const taken: number[] = [];
    const container = document.body.appendChild(document.createElement('div'));
    const muted: AnswerCardsEntry = {
      id: 7,
      text: 'an answer of their own',
      count: 1,
      voted: true,
      likeLabel: '0 likes',
    };
    act(() => {
      render(<AnswerCards answers={[muted]} onReject={(id) => taken.push(id)} />, container);
    });
    const mute = container.querySelector('button');
    act(() => {
      mute?.click();
    });
    expect(taken).toEqual([7]);
  });
});
