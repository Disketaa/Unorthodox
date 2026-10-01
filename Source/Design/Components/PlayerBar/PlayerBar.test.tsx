// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import type { ComponentChildren } from 'preact';
import { PlayerBar, type PlayerBarEntry } from './PlayerBar';

/** A player as the bar draws them, with the fields a test cares about. */
function player(name: string, isOnline = true): PlayerBarEntry {
  return { id: name, name, character: 'Butterfly', color: 'Coral', score: 0, isOnline };
}

/** Mount the bar, flushing the effects its characters write on the way in. */
function mounted(children: ComponentChildren): HTMLElement {
  const root = document.createElement('div');
  document.body.appendChild(root);
  act(() => {
    render(children, root);
  });
  return root;
}

/** The class list of every slot, in the order they were drawn. */
function slotsOf(players: readonly PlayerBarEntry[], ownPlayerId: string | null = null) {
  const root = mounted(<PlayerBar players={players} ownPlayerId={ownPlayerId} />);
  return [...(root.firstElementChild?.children ?? [])].map((node) => node.className.split(' '));
}

/** The name and the score of every slot, which are the only words a slot holds. */
function labelsOf(players: readonly PlayerBarEntry[]) {
  const root = mounted(<PlayerBar players={players} />);
  return [...root.querySelectorAll('span')]
    .map((node) => node.textContent ?? '')
    .filter((text) => text.length > 0);
}

describe('a player the host has lost', () => {
  it('is drawn quieter than one who is there', () => {
    const [online, offline] = slotsOf([player('Аня'), player('Боря', false)]);
    // The class names are hashed, so this is the mechanism rather than the pixels: the two
    // slots differ, and only by the class that says which of them dropped.
    expect(online).not.toEqual(offline);
    expect(offline?.length).toBe((online?.length ?? 0) + 1);
  });

  it('is still in the bar, because the seat is still theirs', () => {
    // A bar that loses a slot reads as a smaller room rather than as a player who left.
    expect(slotsOf([player('Аня'), player('Боря', false)])).toHaveLength(2);
  });

  it('is drawn like somebody who is there when nobody says otherwise', () => {
    // Presence is the host's to know, so an entry that does not say is not a dropped
    // player and must not be marked as one.
    const [known, unknown] = slotsOf([
      player('Аня'),
      { id: 'Б', name: 'Б', character: 'Ghost', color: 'Sky', score: 0 },
    ]);
    expect(known).toEqual(unknown);
  });
});

describe('the bar itself', () => {
  it('draws the local player with a class of its own', () => {
    // The local player is the one mark in the bar that follows the viewer's own tint, and
    // it is a fill rather than a ring, so it is one class on top of the slot's own.
    const [plain, marked] = slotsOf([player('Аня'), player('Боря')], 'Боря');
    expect(plain?.length).toBe(1);
    expect(marked?.length).toBe(2);
  });

  it('keeps the roster order it was given', () => {
    expect(labelsOf(['Аня', 'Боря', 'Вера'].map((name) => player(name)))).toEqual([
      'Аня',
      '0',
      'Боря',
      '0',
      'Вера',
      '0',
    ]);
  });
});