// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { LobbyThemes } from './LobbyThemes';
import { ThemeLimit } from './ThemeGrid';
import { ThemeId, ThemeIds, ThemeMode } from '@/Core';
import { GameConfig } from '@/Game';
import { Strings } from '@/Content';

/** The themes the grid offers, in the order it offers them. */
const named: readonly ThemeId[] = [...ThemeIds];

/** One way of taking themes and the names that go with it, which is what a press asks for. */
type Pool = { mode: ThemeMode; themes: readonly ThemeId[] };

/** The grid as one role sees it. A press is answered here the way the room answers one РІР‚— the
 * host's action comes back down as the new pool РІР‚— since the grid holds no state of its own
 * and a second press is made against whatever the first one was given. */
function mount(isHost: boolean, start: Pool) {
  let pool = start;
  const asked: Pool[] = [];
  const container = document.createElement('div');
  document.body.appendChild(container);
  const draw = () => {
    render(
      <LobbyThemes
        themeMode={pool.mode}
        themes={pool.themes}
        isHost={isHost}
        onLoadCustomThemes={() => {}}
        onEditCustomThemes={() => {}}
        customThemes={[]}
        onPick={(mode, themes) => {
          asked.push({ mode, themes });
          pool = { mode, themes };
          draw();
        }}
      />,
      container
    );
  };
  draw();
  return {
    container,
    asked,
    // The pool the room has, once its own answer has come back.
    pool: () => pool,
    press: (label: ThemeId) => act(() => buttonFor(container, label).click()),
  };
}

/** Every button, in the order they are drawn: the two ways first, then the themes. */
function buttons(container: HTMLElement): HTMLButtonElement[] {
  return [...container.querySelectorAll('button')].filter(
    (button): button is HTMLButtonElement => button instanceof HTMLButtonElement
  );
}

/** The button with a given name on it: a theme, or one of the two ways. */
function buttonFor(container: HTMLElement, label: ThemeId): HTMLButtonElement {
  const found = buttons(container).find((button) => button.textContent === String(label));
  if (found === undefined) throw new Error(`no button reading ${label}`);
  return found;
}

/** Whether a button is drawn filled, which is how the grid shows what is on. */
function isFilled(button: HTMLButtonElement): boolean {
  return button.getAttribute('aria-pressed') === 'true';
}

const random = Strings.lobby.settings.themeModes.Random;
const chosen = Strings.lobby.settings.themeModes.Chosen;

describe('the theme grid', () => {
  it('leads with the two ways the room can be given its themes, on one row like the paces', () => {
    const { container } = mount(true, { mode: 'Random', themes: [] });
    expect(
      buttons(container)
        .slice(0, 2)
        .map((button) => button.textContent)
    ).toEqual([random, chosen]);
  });

  it('offers every theme there is beneath them, and no random one among them', () => {
    // The random bank is a mode, not a ninth theme: a grid holding it beside the eight would read
    // as one more thing the room could be dealt rather than as the alternative to naming.
    const { container } = mount(true, { mode: 'Chosen', themes: [] });
    expect(
      buttons(container)
        .slice(2)
        .filter((button) => button.textContent !== Strings.lobby.settings.loadCustomThemes)
        .map((button) => button.textContent)
    ).toEqual(named);
  });

  it('draws no themes at all under the random bank, since none of them is in play', () => {
    // Eight live buttons under a row that says the room is taking them at random: every one of
    // them does nothing, and the host will press one anyway to see what happens.
    const { container } = mount(true, { mode: 'Random', themes: [] });
    expect(buttons(container)).toHaveLength(2);
    named.forEach((theme) => expect(container.textContent).not.toContain(String(theme)));
  });

  it('brings the themes back when the room turns to choosing, and does not lose them', () => {
    const row = mount(true, { mode: 'Chosen', themes: [named[0], named[1]] });
    row.press(random);
    expect(buttons(row.container)).toHaveLength(2);
    row.press(chosen);
    expect(
      buttons(row.container)
        .slice(2)
        .filter((button) => button.textContent !== Strings.lobby.settings.loadCustomThemes)
    ).toHaveLength(named.length);
    expect(row.pool()).toEqual({ mode: 'Chosen', themes: [named[0], named[1]] });
  });

  it('fills the way the room is being given its themes, and leaves the other quiet', () => {
    const onRandom = mount(true, { mode: 'Random', themes: [] });
    expect(isFilled(buttonFor(onRandom.container, random))).toBe(true);
    expect(isFilled(buttonFor(onRandom.container, chosen))).toBe(false);
    const onChosen = mount(true, { mode: 'Chosen', themes: [named[0]] });
    expect(isFilled(buttonFor(onChosen.container, chosen))).toBe(true);
    expect(isFilled(buttonFor(onChosen.container, random))).toBe(false);
  });

  it('says how many themes are on out of how many the room may name', () => {
    const { container } = mount(true, { mode: 'Chosen', themes: named.slice(0, 4) });
    expect(container.textContent).toContain(Strings.lobby.settings.themesChosen(4, ThemeLimit));
    expect(container.textContent).not.toContain(
      Strings.lobby.settings.themesChosen(0, ThemeLimit)
    );
  });

  it('names the rule plainly while the room is on the random bank, which has no count', () => {
    const { container } = mount(true, { mode: 'Random', themes: [] });
    expect(container.textContent).toContain(Strings.lobby.settings.themes);
    expect(container.textContent).not.toContain(`(${ThemeLimit}/${ThemeLimit})`);
  });

  it('presses a theme on beside the others rather than instead of them', () => {
    const row = mount(true, { mode: 'Chosen', themes: [] });
    row.press(named[0]);
    row.press(named[1]);
    expect(row.asked).toEqual([
      { mode: 'Chosen', themes: [named[0]] },
      { mode: 'Chosen', themes: [named[0], named[1]] },
    ]);
  });

  it('takes a theme back off on a second press, rather than needing a second button', () => {
    const row = mount(true, { mode: 'Chosen', themes: [named[0], named[1]] });
    row.press(named[1]);
    expect(row.asked).toEqual([{ mode: 'Chosen', themes: [named[0]] }]);
  });

  it('keeps the themes named when the room goes back to the random bank', () => {
    // Looking at the random bank must not throw away what the host chose, or a room cannot
    // check its own themes and then change its mind about where they come from.
    const row = mount(true, { mode: 'Chosen', themes: [named[0], named[1]] });
    row.press(random);
    expect(row.pool()).toEqual({ mode: 'Random', themes: [named[0], named[1]] });
    row.press(chosen);
    expect(row.pool()).toEqual({ mode: 'Chosen', themes: [named[0], named[1]] });
  });

  it('names nothing rather than everything when a room starts choosing', () => {
    // An empty pool reads as the whole bank at the deal, so choosing and having chosen nothing
    // cannot quietly deal a bank the host never agreed to.
    const row = mount(true, { mode: 'Random', themes: [] });
    row.press(chosen);
    expect(row.asked).toEqual([{ mode: 'Chosen', themes: [] }]);
  });

  it('stops at the number of themes the lobby deals, and says so by going dead', () => {
    // The bank is the same size whichever pool it is dealt from, so a seventh theme named is a
    // theme the room could never be shown. The grid says so on the buttons rather than ignoring
    // a press the host can see land.
    expect(ThemeLimit).toBe(GameConfig.themes.cardsPerLobby);
    const full = named.slice(0, ThemeLimit);
    const row = mount(true, { mode: 'Chosen', themes: full });
    row.press(named[ThemeLimit]);
    expect(row.asked).toEqual([]);
    expect(buttonFor(row.container, named[ThemeLimit]).disabled).toBe(true);
  });

  it('takes a theme off a full pool, so the grid is not a one-way door', () => {
    const full = named.slice(0, ThemeLimit);
    const row = mount(true, { mode: 'Chosen', themes: full });
    row.press(full[0]);
    expect(row.asked).toEqual([{ mode: 'Chosen', themes: full.slice(1) }]);
    // Freeing a slot frees the buttons that were refused a moment ago.
    expect(buttonFor(row.container, named[ThemeLimit]).disabled).toBe(false);
  });

  it('leaves every theme live under the chosen bank, since nothing named is full yet', () => {
    // The limit is on what the host names, not on what the room is dealt: the random bank is the
    // whole set and is dealt without any of the eight being pressed.
    const { container } = mount(true, { mode: 'Chosen', themes: [] });
    named.forEach((theme) => expect(buttonFor(container, theme).disabled).toBe(false));
  });

  it('shows a client the same pool, dead, since the bank is not a secret', () => {
    const { container } = mount(false, { mode: 'Chosen', themes: [named[0]] });
    buttons(container).forEach((button) => expect(button.disabled).toBe(true));
    expect(isFilled(buttonFor(container, named[0]))).toBe(true);
  });

  it('does not let a client change the pool by pressing a dead button', () => {
    const { container, asked } = mount(false, { mode: 'Random', themes: [] });
    act(() => {
      buttons(container).forEach((button) => button.click());
    });
    expect(asked).toEqual([]);
  });
});
