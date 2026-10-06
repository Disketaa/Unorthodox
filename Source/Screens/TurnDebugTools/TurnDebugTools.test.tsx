// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { TurnDebugTools } from './TurnDebugTools';
import { freshLobbyState, reducer, toPublicState, type HostState } from '@/Game';

const look = { character: 'Butterfly', color: 'Coral' } as const;

/** A room in its lobby holding this many players. */
function room(count: number) {
  const seated = Array.from({ length: count }).reduce<HostState>(
    (state, _, index) =>
      reducer(state, { type: 'JOIN', playerId: `p${index}`, name: `P${index}`, look }),
    freshLobbyState(),
  );
  return toPublicState(seated);
}

/** Mount the dock's controls and press the turn button if it is there. */
function press(count: number, onNextTurn: () => void): boolean {
  const root = document.createElement('div');
  document.body.appendChild(root);
  act(() => {
    render(<TurnDebugTools publicState={room(count)} onNextTurn={onNextTurn} />, root);
  });
  const button = root.querySelector('button');
  if (button === null) return false;
  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  return true;
}

describe('the dock control for the turn', () => {
  it('is in the dock for a room with players in it', () => {
    expect(press(2, () => {})).toBe(true);
  });

  it('hands the turn on when pressed', () => {
    let handed = 0;
    press(2, () => {
      handed += 1;
    });
    expect(handed).toBe(1);
  });

  it('is not there in an empty room, where there is nobody to hand it to', () => {
    expect(press(0, () => {})).toBe(false);
  });
});
