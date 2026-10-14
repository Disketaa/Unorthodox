// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { render } from 'preact';

vi.mock('../../Sounds', () => ({ playSound: vi.fn() }));

const { AnswerCard } = await import('./AnswerCard');

/** A card on a root of its own, with the classes the browser would give it. */
function card(props: Record<string, unknown>): HTMLElement {
  const root = document.body.appendChild(document.createElement('div'));
  render(<AnswerCard text="кот" count={1} {...props} />, root);
  const element = root.firstElementChild;
  if (!(element instanceof HTMLElement)) throw new Error('no card');
  return element;
}

/** Which of the mutually exclusive card states it is in, so an assertion names the state rather
 * than a cursor the test runner cannot resolve — these cursors are SVG images, not keywords. */
function state(element: HTMLElement): string[] {
  return ['Live', 'Takeback', 'Locked', 'Record', 'Blank'].filter((name) =>
    element.className.includes(name)
  );
}

describe('what a card is offering', () => {
  it('offers the hand once it has finished saying everything', () => {
    expect(state(card({ revealed: true, landed: 1 }))).toEqual(['Live']);
  });

  it('offers nothing while the room is still reading it, and says so plainly', () => {
    // Plainly, not refused: refusing says the room has been told this is not available, and what
    // the room has been told so far is only that somebody wrote it. A record, not a refusal.
    const element = card({ revealed: false, landed: 0 });
    expect(state(element)).toEqual(['Record']);
    expect(element.querySelectorAll('button')).toHaveLength(0);
  });

  it('offers the hand on a card the host turned down but may still take back', () => {
    // Out of the round and still pressable: pressing it puts it back, so a card saying it was not
    // available while offering the press that undoes it would be lying.
    expect(state(card({ voted: true, revealed: true, onReject: () => {} }))).toEqual([
      'Takeback',
      'Record',
    ]);
  });

  it('refuses the press on a card nothing can be done with any more', () => {
    // Struck out and pink all over, with nothing left on it to press. A plain arrow there would be
    // the one mark on the card still pretending it is waiting for somebody.
    const settled = card({
      voted: true,
      revealed: true,
      count: 3,
      landed: 3,
      locked: true,
    });
    expect(state(settled)).toEqual(['Locked', 'Record']);
    expect(settled.querySelectorAll('button')).toHaveLength(0);
  });

  it('is a record on a blank, which is nobody having written rather than a refusal', () => {
    expect(state(card({ blank: true, revealed: true }))).toEqual(['Record', 'Blank']);
  });

  it('stays a record on a shared card until the room can see there was more than one of them', () => {
    // The round turned this answer down the moment it came up, but the room is not shown that
    // until the second writer's face lands — a card struck out on arrival would be saying "nobody
    // else had this" before the room has read what "this" was.
    expect(
      state(card({ voted: true, count: 3, landed: 1, revealed: false, locked: true }))
    ).toEqual(['Record']);

    const twoFaces = card({
      voted: true,
      count: 3,
      landed: 2,
      revealed: true,
      locked: true,
    });
    expect(state(twoFaces)).toEqual(['Locked', 'Record']);
  });
});

describe('when a card offers anything at all', () => {
  it('offers the host nothing to press until the card has finished saying everything', () => {
    // One flag for the mute and the like rather than a rule each. A host who can turn an answer
    // down while the room is still reading it is having an opinion about a half-read sentence,
    // and two rules about when a card is ready are two rules that will drift apart.
    expect(
      card({ onReject: () => {}, revealed: false, landed: 0 }).querySelectorAll('button')
    ).toHaveLength(0);
    expect(
      card({ onReject: () => {}, revealed: true, landed: 1 }).querySelectorAll('button')
    ).toHaveLength(1);
  });

  it('offers a player the like on the same beat, not before', () => {
    // The press that used to get through here was a like cast on half an answer, heard as the
    // like sound with nothing on the card behind it.
    expect(
      card({ onLike: () => {}, revealed: false, landed: 0 }).querySelectorAll('button')
    ).toHaveLength(0);
    // Two on a revealed card: the labelled badge in the corner, and the card itself, which is what
    // everybody else in a standing room actually presses.
    expect(
      card({ onLike: () => {}, revealed: true, landed: 1 }).querySelectorAll('button')
    ).toHaveLength(2);
  });
});
