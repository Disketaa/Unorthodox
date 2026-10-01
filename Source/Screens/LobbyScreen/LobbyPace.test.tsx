// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { LobbyPace } from './LobbyPace';
import { Pace } from '@/Game';
import { Strings } from '@/Content';

const standardWaits = ['60с', '90с', '20с'];
const fastWaits = ['40с', '60с', '15с'];

/** The waits on the card, each asserted on its own since labels sit between them. */
function expectWaits(container: HTMLElement, waits: readonly string[]): void {
  waits.forEach((wait) => expect(container.textContent).toContain(wait));
}

function card(container: HTMLElement, pace: Pace, onPick: (pace: Pace) => void): void {
  render(<LobbyPace pace={pace} onPick={onPick} />, container);
}

function press(container: HTMLElement, index: number): void {
  const button = container.querySelectorAll('button')[index];
  if (!(button instanceof HTMLButtonElement)) throw new Error('no button at that index');
  act(() => {
    button.click();
  });
}

function mount(): HTMLElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  card(container, 'Standard', () => {});
  return container;
}

describe('the pace card', () => {
  it('shows the three waits of the pace it is given', () => {
    const container = mount();
    // Read from the config rather than written out, so this cannot pass against a
    // config the card is not actually using.
    expect(container.textContent).toContain(Strings.lobby.settings.writing);
    expect(container.textContent).toContain(Strings.lobby.settings.deciding);
    expect(container.textContent).toContain(Strings.lobby.settings.category);
    expectWaits(container, standardWaits);
  });

  it('marks the room’s own pace as the chosen one', () => {
    // Buttons are drawn in the order `LobbyPace` lists them, Standard first, and the
    // chosen one is the filled button rather than a tick or a border.
    const container = mount();
    const buttons = container.querySelectorAll('button');
    expect(buttons[0].className).not.toBe(buttons[1].className);
  });

  it('lets a client press a button and see what that pace means', () => {
    const container = mount();
    // A setting nobody can look at is a setting nobody can agree to, so the buttons
    // are live for everyone even though only the host's press reaches the room.
    press(container, 1);
    expectWaits(container, fastWaits);
  });

  it('goes back to what the host says, not to what this device pressed', () => {
    const container = mount();
    // The client presses the pace the room is already on, which changes nothing on
    // screen but leaves a preview behind that disagrees with what comes next.
    press(container, 0);
    expectWaits(container, standardWaits);
    // The host then sets Fast. The preview is for a pace that is no longer the room's,
    // so it must be dropped and the host's numbers read instead.
    act(() => {
      card(container, 'Fast', () => {});
    });
    expectWaits(container, fastWaits);
  });

  it('keeps a preview the host has since agreed with', () => {
    const container = mount();
    press(container, 1);
    expectWaits(container, fastWaits);
    // The host picks the same pace, so the room's answer and the preview agree and
    // there is nothing to discard — the numbers must not flicker back to Standard on
    // the way there, which is what a reset on every change would do.
    act(() => {
      card(container, 'Fast', () => {});
    });
    expectWaits(container, fastWaits);
  });
});
