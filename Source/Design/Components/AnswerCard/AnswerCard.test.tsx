// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'preact';

const playSound = vi.fn();

vi.mock('../../Sounds', () => ({ playSound }));

// Imported after the mock's `playSound` exists: a static import of the badge would pull the mocked
// module in while the factory's own closure is still uninitialised.
const { AnswerCard } = await import('./AnswerCard');
const { LikePitchSemitones } = await import('../LikeBadge');
type AnswerAuthor = import('./AnswerCard').AnswerAuthor;

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

/** The row of seats in a card's corner, which is the only thing on a card that says who wrote it. */
function authorsOf(root: HTMLElement): HTMLElement {
  const authors = root.firstElementChild?.querySelector<HTMLElement>('div');
  if (authors === null || authors === undefined) throw new Error('no authors drawn');
  return authors;
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

  it('takes a like from the card itself, not only from the badge', () => {
    // A control the size of a card is the one thing that can be pressed in a room where people are
    // standing up, and a badge in the corner is a small target on a phone. The badge stays the
    // labelled control; the card is the pointer's way to the same action.
    const onLike = vi.fn();
    renderCard({ onLike }).querySelector('button')?.click();
    expect(onLike).toHaveBeenCalledTimes(1);
    expect(playSound).toHaveBeenCalledWith('Pling', LikePitchSemitones);
  });

  it('leaves the host muting with the card and liking with the badge', () => {
    // One full-bleed control per card: the host's is the mute, since muting is what their screen
    // is for, and their like stays on the badge rather than fighting the mute for the card.
    const onReject = vi.fn();
    const onLike = vi.fn();
    const [whole, badge] = [...renderCard({ onReject, onLike }).querySelectorAll('button')];
    whole?.click();
    expect(onReject).toHaveBeenCalledTimes(1);
    expect(onLike).not.toHaveBeenCalled();
    badge?.click();
    expect(onLike).toHaveBeenCalledTimes(1);
  });

  it('draws a badge but no controls where there is nothing to press', () => {
    // Every screen but the host's draws the board as a record, and a player is shown the count on
    // their own answer without being offered anything to do about it.
    const root = renderCard({ onReject: undefined, likes: 3 });
    expect(root.querySelectorAll('button').length).toBe(0);
    expect(root.textContent).toContain('3');
  });

  it('draws no figure at all on a card nobody has liked', () => {
    // A zero is a number nobody asked for, and it would sit on every card for most of a round.
    // The mark alone says a card can be liked; the figure says how many have.
    const root = renderCard({ onReject: () => {}, onLike: () => {}, likes: 0 });
    expect(root.querySelector('button + span')?.textContent).toBe('');
  });

  it('draws the badge in the corner of the card rather than in the flow of the answer', () => {
    // In the flow it would push the answer about as the count grows, and a card whose text moves
    // when somebody likes it is a card nobody can read while they are being read to.
    const corner = renderCard({ onReject: () => {}, onLike: () => {}, likes: 2 }).querySelector(
      'button + span'
    );
    expect(corner?.tagName).toBe('SPAN');
    expect(corner?.textContent).toBe('2');
  });

  it('draws no badge at all on a card the host has muted', () => {
    // A mute takes the answer off the board, so there is nothing on the card for a like to be,
    // and the room cannot take a mute back: a badge there would invite presses that do nothing
    // and cannot be taken back either.
    const root = renderCard({ voted: true, likes: 4, onReject: () => {}, onLike: () => {} });
    expect(root.textContent).not.toContain('4');
    expect(root.querySelectorAll('button').length).toBe(1);
  });
});

describe('who wrote an answer', () => {
  const two: AnswerAuthor[] = [
    { id: 'p1', name: 'Ghost Player', character: 'Ghost', color: 'Sky' },
    { id: 'p2', name: 'Star Player', character: 'Star', color: 'Rose' },
  ];

  it('draws a seat per player, with the name on it', () => {
    const root = renderCard({ count: 2, authors: two, onLike: () => {} });
    expect(root.textContent).toContain('Ghost Player');
    expect(root.textContent).toContain('Star Player');
  });

  it('draws a seat for the one player who wrote it', () => {
    // Every card says who wrote it, the way the bar at the top of the game does: a card with one
    // name on it is the common case and the room reads the same markers either way.
    const root = renderCard({ count: 1, authors: [two[0] as AnswerAuthor], onLike: () => {} });
    expect(root.textContent).toContain('Ghost Player');
  });

  it('names every writer rather than counting the rest of the room', () => {
    // A count is a number the room has to do arithmetic on to find a person, and the whole point
    // of the corner is that nobody has to: ten people writing the same thing is ten faces.
    const many: AnswerAuthor[] = [
      ...two,
      { id: 'p3', name: 'Daisy Player', character: 'Daisy', color: 'Mint' },
      { id: 'p4', name: 'Hat Player', character: 'Hat', color: 'Lime' },
    ];
    const root = renderCard({ count: 4, authors: many, onLike: () => {} });
    expect(root.textContent).toContain('Daisy Player');
    expect(root.textContent).toContain('Hat Player');
  });

  it('draws the seats smaller and closer the more writers there are', () => {
    // A card is not wide enough for a room at the bar's own sizes, so the seats give up their size
    // before the writers give up their faces: the corner still says everybody either way.
    const many: AnswerAuthor[] = Array.from({ length: 9 }, (_, index) => ({
      id: `p${index}`,
      name: `Player ${index}`,
      character: 'Ghost',
      color: 'Sky',
    }));
    const roomy = renderCard({ count: 4, authors: many.slice(0, 4), onLike: () => {} });
    const crowded = renderCard({ count: 7, authors: many.slice(0, 7), onLike: () => {} });
    const tight = renderCard({ count: 9, authors: many, onLike: () => {} });
    expect(authorsOf(roomy).className).not.toContain('Crowd');
    expect(authorsOf(crowded).className).toContain('Crowd');
    expect(authorsOf(tight).className).toContain('Tight');
  });

  it('waits for the room to read the sentence before it says who wrote it', () => {
    // The whole point of the delay. A card that named its writers the instant it came up would
    // spend the round's best joke on the frame the room has not read the answer yet.
    const before = renderCard({
      count: 2,
      authors: two,
      authorsShown: false,
      onLike: () => {},
    });
    expect(before.textContent).not.toContain('Ghost Player');
    const after = renderCard({ count: 2, authors: two, authorsShown: true, onLike: () => {} });
    expect(after.textContent).toContain('Ghost Player');
  });

  it('draws the seats on a blank, since a blank is who sat the round out', () => {
    // The card says nobody wrote anything, and the seats are the only thing on it that says which
    // nobody that was: a blank with no faces on it is an empty card the room can learn nothing
    // from, and a room of them is a board of identical holes.
    const root = renderCard({ count: 1, blank: true, authors: two, onLike: () => {} });
    expect(root.textContent).toContain('Ghost Player');
    expect(root.textContent).toContain('Star Player');
  });
});
