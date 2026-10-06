// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import type { ComponentChildren } from 'preact';
import { PlayerBar, type PlayerBarEntry } from './PlayerBar';

/** A room as the bar draws it. */
function player(overrides: Partial<PlayerBarEntry> = {}): PlayerBarEntry {
  return {
    id: 'p0',
    name: 'Anya',
    score: 0,
    character: 'Butterfly',
    color: 'Coral',
    ...overrides,
  };
}

/** Mount a bar, flushing the effects its characters write on the way in. */
function mounted(children: ComponentChildren): HTMLElement {
  const root = document.createElement('div');
  document.body.appendChild(root);
  act(() => {
    render(children, root);
  });
  return root;
}

describe('the bar of hexes', () => {
  it('draws one hexagon per player, each under its own name', () => {
    const root = mounted(
      <PlayerBar
        players={[player({ id: 'p0' }), player({ id: 'p1', name: 'Berenice' })]}
      />,
    );
    expect(root.querySelectorAll('[class*="Slot"]')).toHaveLength(2);
    // A face alone asks a player who has just joined to remember which one they picked, and a
    // name is what they look for. Cut short in the drawing, never in the data. Each name is
    // followed by its score, which the pointer brings up in its place — so a label walked without
    // a pointer still carries both.
    expect(root.querySelectorAll('[class*="Name"]')).toHaveLength(2);
    expect(root.querySelectorAll('[class*="Score"]')).toHaveLength(2);
    expect([...root.querySelectorAll('[class*="Name"]')].map((n) => n.textContent)).toEqual([
      'Anya',
      'Berenice',
    ]);
  });

  it('draws the name as given, leaving the cutting to the drawing', () => {
    const root = mounted(<PlayerBar players={[player({ name: 'Maximiliana' })]} />);
    expect(root.querySelector('[class*="Name"]')?.textContent).toBe('Maximiliana');
  });

  it('is drawn once, whatever the room holds', () => {
    const players = Array.from({ length: 6 }, (_, index) => player({ id: `p${index}` }));
    expect(mounted(<PlayerBar players={players} />).children).toHaveLength(1);
  });

  it('is in the viewer\'s own tint, because it is the viewer\'s own seat', () => {
    const root = mounted(<PlayerBar players={[player()]} ownPlayerId="p0" />);
    expect(root.querySelector('[class*="Self"]')).not.toBeNull();
  });

  it('fills only the local seat, in a row of twelve nobody can tell apart', () => {
    const players = Array.from({ length: 12 }, (_, index) => player({ id: `p${index}` }));
    const root = mounted(<PlayerBar players={players} ownPlayerId="p5" />);
    expect(root.querySelectorAll('[class*="Self"]')).toHaveLength(1);
  });
});

describe('the host', () => {
  it('carries no crown, since the name already says who this is', () => {
    // The host is the first player of the roster, which is where the room puts them, so the bar
    // asks for no crown of its own: a room of one is a room whose only player is hosting. A mark
    // beside the name would be a second thing to read in a row of twelve.
    const root = mounted(
      <PlayerBar players={[player(), player({ id: 'p1', name: 'Berenice' })]} />,
    );
    expect(root.querySelectorAll('[class*="Crown"]')).toHaveLength(0);
  });

  it('wears none in a full room either', () => {
    const players = Array.from({ length: 12 }, (_, index) => player({ id: `p${index}` }));
    expect(mounted(<PlayerBar players={players} />).querySelectorAll('[class*="Crown"]')).toHaveLength(
      0,
    );
  });

  it('draws nothing beside a name', () => {
    const seat = mounted(<PlayerBar players={[player({ name: 'Anya' })]} />).firstElementChild;
    const label = seat?.querySelector('[class*="Label"]');
    expect(label?.querySelector('[class*="Name"]')?.textContent).toBe('Anya');
  });
});

describe('the score', () => {
  it('is drawn in the label, beside the name, in the room\'s own order', () => {
    // Both are always in the DOM and the stylesheet swaps which one is visible, so a client that
    // walks the label reads the score even where a pointer cannot reach it.
    const label = mounted(<PlayerBar players={[player({ name: 'Anya', score: 12 })]} />).firstElementChild
      ?.querySelector('[class*="Label"]');
    expect(label?.querySelector('[class*="Score"]')?.textContent).toBe('12');
  });

  it('is zero before anything is scored, rather than missing', () => {
    // Only the Scores and Final phases send a score at all, so a room in the lobby or mid-round
    // reads as zero. A missing one would leave the label half a sentence.
    const label = mounted(<PlayerBar players={[player()]}/>).firstElementChild?.querySelector(
      '[class*="Label"]',
    );
    expect(label?.querySelector('[class*="Score"]')?.textContent).toBe('0');
  });

  it('draws one per seat, so twelve players are twelve scores', () => {
    const players = Array.from({ length: 12 }, (_, index) => player({ id: `p${index}`, score: index }));
    expect(mounted(<PlayerBar players={players} />).querySelectorAll('[class*="Score"]')).toHaveLength(
      12,
    );
  });

  it('is a number and not the name, so a score cannot be mistaken for a label', () => {
    const label = mounted(<PlayerBar players={[player({ name: 'Kai', score: 19 })]} />).firstElementChild
      ?.querySelector('[class*="Label"]');
    expect(label?.textContent).toBe('Kai19');
  });
});

describe('a player the host has lost', () => {
  it('is held back rather than removed, because the seat is still theirs', () => {
    const root = mounted(<PlayerBar players={[player({ isOnline: false })]} />);
    expect(root.querySelector('[class*="Offline"]')).not.toBeNull();
  });

  it('is drawn like somebody who is there when nobody says otherwise', () => {
    const root = mounted(<PlayerBar players={[player()]} />);
    expect(root.querySelector('[class*="Offline"]')).toBeNull();
  });
});
