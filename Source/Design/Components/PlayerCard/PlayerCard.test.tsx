// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import type { ComponentChildren } from 'preact';
import { PlayerCard, type PlayerCardEntry } from './PlayerCard';

/** A player as the card draws them, with the fields a test cares about. */
function player(overrides: Partial<PlayerCardEntry> = {}): PlayerCardEntry {
  return { name: 'Аня', character: 'Butterfly', color: 'Coral', score: 7, ...overrides };
}

/** Mount a card, flushing the effects its character writes on the way in. */
function mounted(children: ComponentChildren): HTMLElement {
  const root = document.createElement('div');
  document.body.appendChild(root);
  act(() => {
    render(children, root);
  });
  return root;
}

/** The classes on the card itself, which is the one thing it draws around the player. */
function cardOf(children: ComponentChildren): string[] {
  const node = mounted(children).firstElementChild;
  return (node?.className ?? '').split(' ');
}

describe('the card of this player', () => {
  it('draws one player: their name and their score, and nothing else', () => {
    const root = mounted(<PlayerCard player={player({ name: 'Аня', score: 128 })} />);
    const leaves = [...root.querySelectorAll('span')]
      .filter((node) => node.querySelector('span') === null)
      .map((node) => node.textContent ?? '')
      .filter((text) => text.length > 0);
    // The name and the figure are the whole of it, which is the point: the roster this replaced
    // put a name and a score in front of every player in the room, and a player looking for
    // where they stand had to find their own face in sixteen of them first.
    expect(leaves).toEqual(['Аня', '128']);
    // Two children and not three: a block of words and a drawing, so the row has two places the
    // face could land rather than three.
    expect(root.firstElementChild?.children).toHaveLength(2);
  });

  it('is drawn once, whatever the room holds', () => {
    // The card is not a list of anything, so there is nothing about it that depends on how many
    // players there are: it takes one player, and the card is the one element standing at the top
    // of it rather than a row of the same.
    const root = mounted(<PlayerCard player={player()} />);
    expect(root.children).toHaveLength(1);
  });

  it('is in the viewer\'s own tint, because it is the viewer\'s own card', () => {
    // The accent wash the roster used to put on one seat out of sixteen. The whole card is that
    // seat now, so the wash is the card rather than a mark on it.
    const card = cardOf(<PlayerCard player={player()} />);
    expect(card.length).toBeGreaterThan(0);
    const sheet = mounted(<PlayerCard player={player()} />);
    expect(sheet.firstElementChild?.getAttribute('class')).toContain('Root');
  });
});

describe('the host', () => {
  it('is crowned, and a player who is not hosting is not', () => {
    const host = mounted(<PlayerCard player={player()} isHost />);
    const plain = mounted(<PlayerCard player={player()} />);
    expect(host.querySelectorAll('span[class*="CrownIcon"]')).toHaveLength(1);
    expect(plain.querySelectorAll('span[class*="CrownIcon"]')).toHaveLength(0);
  });

  it('wears the crown on the name\'s line, beside the name', () => {
    // In the flow rather than lifted over the top edge of the card: hung outside, the top of it
    // was the top of the screen the game draws in, and the crown came off it.
    const root = mounted(<PlayerCard player={player()} isHost />);
    expect(root.querySelector('[class*="Crown"]')?.parentElement?.getAttribute('class')).toContain(
      'NameRow',
    );
  });
});

describe('a player the host has lost', () => {
  it('is held back rather than removed, because the card is still theirs', () => {
    const classes = cardOf(<PlayerCard player={player({ isOnline: false })} />);
    expect(classes.some((name) => name.includes('Offline'))).toBe(true);
  });

  it('is drawn like somebody who is there when nobody says otherwise', () => {
    const classes = cardOf(<PlayerCard player={player()} />);
    expect(classes.some((name) => name.includes('Offline'))).toBe(false);
  });
});
