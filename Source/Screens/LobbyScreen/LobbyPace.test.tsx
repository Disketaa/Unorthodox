// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { LobbyPace } from './LobbyPace';
import { GameConfig, reviewingDurationMs, type Pace } from '@/Game';
import { Strings } from '@/Content';

/** The three waits of the standard pace, as the card writes them. Taken from the config rather
 * than written out, so this cannot pass against a config the card is not actually using: the
 * theme clock in particular is being moved around while the roll at the end of it is looked at.
 * A full room, since that is the one board a pace is actually priced for. */
const standardWaits = waitsOf('Standard', GameConfig.limits.maxPlayers);

/** One pace's three waits as the card shows them: whole seconds, each with the unit on it. */
function waitsOf(pace: Pace, players: number): string[] {
  const { writingMs, categoryMs } = GameConfig.paces[pace];
  const decidingMs = reviewingDurationMs(players, pace);
  return [writingMs, decidingMs, categoryMs].map((ms) =>
    Strings.lobby.settings.seconds(ms / 1000)
  );
}
/** The waits on the card, each asserted on its own since labels sit between them. */
function expectWaits(container: HTMLElement, waits: readonly string[]): void {
  waits.forEach((wait) => expect(container.textContent).toContain(wait));
}

function mount(isHost: boolean, picked: Pace[] = []): HTMLElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(
    <LobbyPace
      pace="Standard"
      themes={[]}
      themeMode="Random"
      players={12}
      isHost={isHost}
      onLoadCustomThemes={() => {}}
      onPick={(pace) => picked.push(pace)}
      onPickThemes={() => {}}
    />,
    container
  );
  return container;
}

function buttons(container: HTMLElement): HTMLButtonElement[] {
  const found: HTMLButtonElement[] = [];
  container.querySelectorAll('button').forEach((button) => {
    if (button instanceof HTMLButtonElement) found.push(button);
  });
  return found;
}

/** The pace buttons, found by the word on them rather than by where they sit: the card's own
 * control at the title's end carries its name in a label instead, and a client's copy of it is
 * live. */
function paceButtons(container: HTMLElement): HTMLButtonElement[] {
  const paceWords: readonly string[] = Object.values(Strings.lobby.settings.paces);
  return buttons(container).filter((button) => paceWords.includes(button.textContent ?? ''));
}

describe('the pace card', () => {
  it('shows the three waits of the pace the room is set to', () => {
    const container = mount(true);
    // Read from the config rather than written out, so this cannot pass against a
    // config the card is not actually using.
    expect(container.textContent).toContain(Strings.lobby.settings.writing);
    expect(container.textContent).toContain(Strings.lobby.settings.deciding);
    expect(container.textContent).toContain(Strings.lobby.settings.category);
    expectWaits(container, standardWaits);
  });

  it('fills the room’s own pace and leaves the other one quiet', () => {
    const container = mount(true);
    expect(paceButtons(container)[0].className).not.toBe(paceButtons(container)[1].className);
  });

  it('changes the room when the host presses a button', () => {
    const picked: Pace[] = [];
    const container = mount(true, picked);
    act(() => {
      paceButtons(container)[1].click();
    });
    expect(picked).toEqual(['Fast']);
  });

  it('shows a client the same numbers, so the pace is not a secret', () => {
    // A player who cannot see what the room is playing cannot agree to play it.
    expectWaits(mount(false), standardWaits);
  });

  it('draws a client’s buttons dead, so the setting is visibly not theirs', () => {
    const dead = paceButtons(mount(false));
    expect(dead).toHaveLength(2);
    // `disabled` rather than a new variant: it is what puts the not-allowed cursor and
    // the half opacity on, and a control that ignores its press should say so to the
    // browser rather than only to the eye.
    dead.forEach((button) => expect(button.disabled).toBe(true));
  });

  it('leaves a client the local controls, since the window, the sounds and the music are nobody else’s', () => {
    // Fullscreen, the volume and the music are looks at this device rather than settings of
    // the room, so they are the three controls on the card a client may press.
    const live = buttons(mount(false)).filter((button) => !button.disabled);
    expect(live).toHaveLength(3);
    expect(live[0].getAttribute('aria-label')).toBe(Strings.lobby.settings.fullscreen);
    expect(live[1].getAttribute('aria-label')).toBe(Strings.lobby.settings.mute);
    expect(live[2].getAttribute('aria-label')).toBe(Strings.lobby.settings.musicOff);
  });

  it('does not let a client change the room by pressing a dead button', () => {
    const picked: Pace[] = [];
    const container = mount(false, picked);
    act(() => {
      buttons(container).forEach((button) => button.click());
    });
    expect(picked).toEqual([]);
  });
});
