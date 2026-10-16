import { describe, it, expect } from 'vitest';
import { reducer } from './Reducer';
import { freshLobbyState, type HostState, type LobbyState } from './GameState';
import { isThemeMode, ThemeId, ThemeIds, ThemeMode } from '@/Core';
import { GameConfig } from './GameConfig';

/** The themes the room may name, in the registry's order. */
const named: readonly ThemeId[] = [...ThemeIds];

/** The lobby the room is in, or the test stops: every one of these is about what the room may do
 * before the first round, and a state that is not a lobby cannot answer that. Narrowing rather
 * than asserting, since a cast would say the reducer returns a lobby whether it does or not. */
function lobbyState(state: HostState): LobbyState {
  if (state.phase !== 'Lobby') throw new Error(`expected a lobby, found ${state.phase}`);
  return state;
}

/** A fresh lobby, which starts on the random bank and so on the whole set. */
function lobby(): LobbyState {
  return freshLobbyState();
}

/** A room with one seat in it, which is the least a room can be and still begin a game. */
function seated(): LobbyState {
  return lobbyState(
    reducer(lobby(), {
      type: 'JOIN',
      playerId: 'p1',
      name: 'Ann',
      look: { character: 'Butterfly', color: 'Coral' },
    })
  );
}

function choose(state: LobbyState, mode: ThemeMode, themes: readonly ThemeId[]): LobbyState {
  return lobbyState(reducer(state, { type: 'SET_THEMES', mode, themes }));
}

/** A room part-way through choosing, which is the point at which a pool stops moving. */
function playing() {
  return reducer(seated(), { type: 'START_GAME', durationMs: 1000, startedAt: 0 });
}

describe('reducer SET_THEMES action', () => {
  it('starts a room on the random bank, which names nothing', () => {
    expect(lobby().themeMode).toBe('Random');
    expect(lobby().themes).toEqual([]);
  });

  it('takes the themes the host named, in the registry’s order', () => {
    const state = choose(lobby(), 'Chosen', [named[3], named[0]]);
    expect(state).toMatchObject({ themeMode: 'Chosen', themes: [named[0], named[3]] });
  });

  it('unselects a theme the host presses a second time, by naming without it', () => {
    const state = choose(choose(lobby(), 'Chosen', [named[0], named[1]]), 'Chosen', [named[0]]);
    expect(state.themes).toEqual([named[0]]);
  });

  it('keeps the names when the room is put back on the random bank', () => {
    // A host who has looked at the whole bank and come back has not forgotten what they chose,
    // and a state that dropped it would make the two buttons a one-way door.
    const chosen = choose(lobby(), 'Chosen', [named[0], named[1]]);
    expect(choose(chosen, 'Random', chosen.themes)).toMatchObject({
      themeMode: 'Random',
      themes: [named[0], named[1]],
    });
  });

  it('holds nothing rather than everything when the host is choosing none', () => {
    expect(choose(lobby(), 'Chosen', []).themes).toEqual([]);
  });

  it('keeps the pool no larger than the bank the lobby deals', () => {
    expect(choose(lobby(), 'Chosen', named).themes).toHaveLength(
      GameConfig.themes.cardsPerLobby
    );
  });

  it('drops a theme this build has no bank for', () => {
    const state = choose(lobby(), 'Chosen', [named[0], 'НетТакой']);
    expect(state.themes).toEqual([named[0]]);
  });

  it('reads an unrecognised mode as the random bank, since no button offers it', () => {
    // The guard rather than the reducer, because a mode off the union cannot be built as an
    // action without a cast — and the guard is the one thing the reducer and the stored room
    // both go through, so this is where the rule actually lives.
    expect(isThemeMode('Всё')).toBe(false);
    expect(isThemeMode('Chosen')).toBe(true);
  });

  it('changes nothing once a round has begun, since a deal already drawn cannot be redrawn', () => {
    const begun = playing();
    expect(begun.phase).toBe('Choosing');
    expect(reducer(begun, { type: 'SET_THEMES', mode: 'Chosen', themes: [named[0]] })).toBe(
      begun
    );
  });

  it('keeps the pool across the phase it was set in, so every phase deals the same bank', () => {
    const state = choose(seated(), 'Chosen', [named[0], named[1]]);
    expect(playing().phase).toBe('Choosing');
    expect(
      reducer(state, { type: 'START_GAME', durationMs: 1000, startedAt: 0 }).themes
    ).toEqual([named[0], named[1]]);
  });
});
