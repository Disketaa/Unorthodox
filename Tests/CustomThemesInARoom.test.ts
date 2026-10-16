// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { reducer, freshLobbyState, type HostState, type LobbyState } from '../Source/Game';
import { offeredThemes } from '../Source/Network/HostThemePool';
import { themePool, ThemeIds, type CustomTheme } from '../Source/Core';
import { GameConfig } from '../Source/Game';

const custom = (name: string): CustomTheme => ({
  name,
  color: 'Amber',
  questions: ['Вопрос 1', 'Вопрос 2'],
});

/** What the browser has saved, which is where the naming rules read a theme's own name from. */
function withCache(themes: readonly CustomTheme[]): void {
  localStorage.setItem('unorthodox-custom-themes', JSON.stringify(themes));
}

/** The lobby the room is in, or the test stops: these are all about what a room may do before
 * the first round, and a state that is not a lobby cannot answer that. */
function lobbyState(state: HostState): LobbyState {
  if (state.phase !== 'Lobby') throw new Error(`expected a lobby, found ${state.phase}`);
  return state;
}

/** A lobby holding one pasted theme and naming it, the room after a host has pressed its card. */
function roomNaming(name: string): LobbyState {
  const pasted = custom(name);
  withCache([pasted]);
  const state = lobbyState(
    reducer(freshLobbyState(), { type: 'SET_CUSTOM_THEMES', themes: [pasted] })
  );
  return lobbyState(reducer(state, { type: 'SET_THEMES', mode: 'Chosen', themes: [name] }));
}

describe('naming a custom theme in a room', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps a custom theme in the selection once the room knows it', () => {
    expect(roomNaming('Призраки').themes).toContain('Призраки');
  });

  it('keeps it beside the authored themes rather than instead of them', () => {
    const pasted = custom('Призраки');
    withCache([pasted]);
    let state = reducer(freshLobbyState(), { type: 'SET_CUSTOM_THEMES', themes: [pasted] });
    state = reducer(state, {
      type: 'SET_THEMES',
      mode: 'Chosen',
      themes: ['Природа', 'Призраки'],
    });
    expect(state.themes).toEqual(['Природа', 'Призраки']);
  });

  it('names a custom theme the room knows but this browser has not saved', () => {
    // The room has it; the cache has not been written yet, which is every client's first second.
    const pasted = custom('Призраки');
    let state = reducer(freshLobbyState(), { type: 'SET_CUSTOM_THEMES', themes: [pasted] });
    state = reducer(state, { type: 'SET_THEMES', mode: 'Chosen', themes: ['Призраки'] });
    expect(state.themes).toEqual(['Призраки']);
  });

  it('strikes a custom theme out of the selection by name', () => {
    const state = reducer(roomNaming('Призраки'), {
      type: 'REMOVE_CUSTOM_THEME',
      name: 'Призраки',
    });
    expect(state.themes).not.toContain('Призраки');
    expect(state.customThemes?.has('Призраки')).toBe(false);
  });

  it('deals custom themes into the random bank, since a random bank is the whole set', () => {
    expect(themePool('Random', [], [custom('Призраки')])).toContain('Призраки');
  });

  it('deals a named custom theme, and no authored theme beside it', () => {
    expect(themePool('Chosen', ['Призраки'], [custom('Призраки')])).toEqual(['Призраки']);
  });

  it('offers the room the themes in the selection, custom ones included', () => {
    expect(offeredThemes(roomNaming('Призраки'), 'ABCD')).toEqual(['Призраки']);
  });

  it('still names a custom theme in a room that has already named its full six', () => {
    const pasted = custom('Призраки');
    withCache([pasted]);
    const authored = ThemeIds.slice(0, 6);
    let state = reducer(freshLobbyState(), { type: 'SET_CUSTOM_THEMES', themes: [pasted] });
    state = reducer(state, {
      type: 'SET_THEMES',
      mode: 'Chosen',
      themes: [...authored, 'Призраки'],
    });
    // The press that was refused is the last one made, so it is the one that stands and the
    // theme that gave way is the one the host took off to make room for it.
    expect(state.themes).toContain('Призраки');
    expect(state.themes).toHaveLength(GameConfig.themes.cardsPerLobby);
  });
});
