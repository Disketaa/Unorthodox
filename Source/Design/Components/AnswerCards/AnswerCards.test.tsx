// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { AnswerCards, type AnswerCardsEntry } from './AnswerCards';

/** A board of `count` answers, all different, and nothing voted out. */
function answers(count: number): AnswerCardsEntry[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    text: `answer ${id}`,
    count: 1,
    voted: false,
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

  it('draws the board as records when nobody may vote on it', () => {
    // The round being shown rather than answered, which is the one case where a card is not a
    // control and must not read as one.
    const { cards } = mount(4);
    expect(cards.every((card) => card.className.includes('Record'))).toBe(true);
  });
});
