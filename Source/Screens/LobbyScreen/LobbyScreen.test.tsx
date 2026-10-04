// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { LobbyScreen } from './LobbyScreen';
import { Pace } from '@/Game';
import { PlayerLook } from '@/Core';

const look: PlayerLook = { character: 'Butterfly', color: 'Coral' };

/** The lobby as one role sees it, with the presses it makes collected. */
function lobby(isHost: boolean, pace: Pace = 'Standard') {
  const pickedPaces: Pace[] = [];
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(
    <LobbyScreen
      roomCode="ABCD"
      players={[]}
      pace={pace}
      ownPlayerId="p1"
      ownPlayerName="Ann"
      ownLook={{ character: look.character, color: look.color }}
      isHost={isHost}
      onPickLook={() => {}}
      onPickPace={(next) => pickedPaces.push(next)}
      onStart={() => {}}
      onExit={() => {}}
      onKick={() => {}}
    />,
    container,
  );
  return { container, pickedPaces };
}

/**
 * The pace buttons, found by the settings card they sit in.
 *
 * Not simply every button on the screen: the lobby also has the exit control,
 * and the roster's own controls, so a bare `querySelectorAll('button')` would
 * assert over controls this has nothing to do with and would pass or fail for
 * the wrong reason.
 */
function paceButtons(container: HTMLElement): HTMLButtonElement[] {
  const found: HTMLButtonElement[] = [];
  container.querySelectorAll('button').forEach((button) => {
    if (button instanceof HTMLButtonElement && button.textContent?.startsWith('Обычно')) {
      found.push(button);
    }
  });
  return found.concat(
    [...container.querySelectorAll('button')].filter(
      (button): button is HTMLButtonElement =>
        button instanceof HTMLButtonElement && button.textContent === 'Быстро',
    ),
  );
}

describe('the lobby as a whole', () => {
  it('gives the host live pace buttons', () => {
    // The card's own test passes `isHost` directly, so it cannot see a screen that
    // forgets to forward it — and a missing prop arrives as `undefined`, which reads as
    // "not the host" and leaves the host with two dead buttons and no way to set a pace.
    const buttons = paceButtons(lobby(true).container);
    expect(buttons).toHaveLength(2);
    buttons.forEach((button) => expect(button.disabled).toBe(false));
  });

  it("gives a client's pace buttons the dead state", () => {
    const buttons = paceButtons(lobby(false).container);
    expect(buttons).toHaveLength(2);
    buttons.forEach((button) => expect(button.disabled).toBe(true));
  });

  it('shows both roles the same waits, since the pace is not a secret', () => {
    expect(lobby(true, 'Fast').container.textContent).toContain('40с');
    expect(lobby(false, 'Fast').container.textContent).toContain('40с');
  });
});
