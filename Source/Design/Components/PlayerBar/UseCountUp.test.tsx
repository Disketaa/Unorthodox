// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { useCountUp } from './UseCountUp';
import type { PlayerBarEntry } from './PlayerBar';

/** Hoisted with the mock, so the factory can reach it: the mock is lifted above the imports and
 * the sound has to be there before the module under test asks for it. */
const { playSound } = vi.hoisted(() => ({ playSound: vi.fn() }));

vi.mock('../../Sounds', () => ({ playSound }));

beforeEach(() => {
  playSound.mockClear();
});

/** The hook on its own, so a seat's climb can be watched without a whole bar around it. */
function Harness({ payout, value }: { payout: PlayerBarEntry['payout']; value: number }) {
  const counting = useCountUp(payout, value);
  return <span>{counting === undefined ? '' : counting}</span>;
}

/** Show a seat an addition and then the total it adds up to, as the count walks the board. */
function counted(added: number, total: number): void {
  const root = document.body.appendChild(document.createElement('div'));
  act(() => {
    render(<Harness payout={{ value: added, added: true }} value={added} />, root);
  });
  act(() => {
    render(
      <Harness payout={{ value: total, added: false, from: total - added }} value={total} />,
      root
    );
  });
}

describe('the seat counting up', () => {
  it('pops when a card has paid it something', () => {
    // The note says the figure has landed and the seat is done: the standing grows from what it
    // was to what it now is, and the room watches it grow.
    counted(12, 42);
    expect(playSound).toHaveBeenCalledWith('Pop');
  });

  it('says nothing when a card has paid it nothing', () => {
    // A card the room turned down, or one two people wrote, pays nothing: the seat stands where
    // it stood, and a note saying it was paid would be the game announcing a figure it is not
    // paying. The card still leaves the board — the count walks over it either way.
    counted(0, 42);
    expect(playSound).not.toHaveBeenCalled();
  });
});
