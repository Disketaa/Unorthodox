// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import type { ComponentChildren } from 'preact';
import { PlayerBar, type PlayerBarEntry } from './PlayerBar';

/** A room as the bar draws it. */
function player(overrides: Partial<PlayerBarEntry> = {}): PlayerBarEntry {
  return { id: 'p0', character: 'Butterfly', color: 'Coral', ...overrides };
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
  it('draws one hexagon per player and nothing else in them', () => {
    const root = mounted(
      <PlayerBar
        players={[player({ id: 'p0' }), player({ id: 'p1', character: 'Ghost', color: 'Sky' })]}
      />,
    );
    // The face is the whole of a seat: a name and a score would not fit twelve to a row, and a
    // face is recognised where a name is read.
    expect(root.textContent).toBe('');
    expect(root.querySelectorAll('[class*="Slot"]')).toHaveLength(2);
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
  it('is crowned, and every other seat is not', () => {
    // The host is the first player of the roster, which is where the room puts them, so the bar
    // asks for no crown of its own: a room of one is a room whose only player is hosting.
    const crowned = mounted(<PlayerBar players={[player(), player({ id: 'p1' })]} />);
    expect(crowned.querySelectorAll('span[class*="CrownIcon"]')).toHaveLength(1);
    const seats = [...crowned.firstElementChild?.children ?? []];
    expect(seats[0].querySelector('span[class*="CrownIcon"]')).not.toBeNull();
    expect(seats[1].querySelector('span[class*="CrownIcon"]')).toBeNull();
  });

  it('is crowned when this browser is the only one in the room', () => {
    expect(
      mounted(<PlayerBar players={[player()]} ownPlayerId="p0" />).querySelectorAll(
        'span[class*="CrownIcon"]',
      ),
    ).toHaveLength(1);
  });

  it('wears one crown in a full room', () => {
    const players = Array.from({ length: 12 }, (_, index) => player({ id: `p${index}` }));
    const root = mounted(<PlayerBar players={players} />);
    expect(root.querySelectorAll('span[class*="CrownIcon"]')).toHaveLength(1);
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
