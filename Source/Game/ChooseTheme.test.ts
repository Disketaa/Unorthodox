import { describe, it, expect } from 'vitest';
import { reducer } from './Reducer';
import { freshLobbyState } from './GameState';
import { toPublicState } from './PublicState';
import type { HostState } from './GameState';
import type { ThemeId } from '@/Core';

/** A lobby with two players in it, which is the smallest room a game can start in. */
function lobby(): HostState {
  const look = { character: 'Butterfly', color: 'Coral' } as const;
  return {
    ...freshLobbyState(),
    players: new Map([
      ['p1', { name: 'Alice', look, isOnline: true }],
      ['p2', { name: 'Bob', look, isOnline: true }],
    ]),
  };
}

const choosing = { type: 'START_GAME', durationMs: 20_000, startedAt: 1000 } as const;
const writing = {
  type: 'START_WRITING',
  topic: 'A topic',
  durationMs: 60_000,
  startedAt: 2000,
} as const;

/** The room with the bank on offer and the turn on the first seat. */
function choosingRoom(): HostState {
  return reducer(lobby(), choosing);
}

describe('choosing a theme', () => {
  it('is the room opening with no theme on it', () => {
    const state = choosingRoom();
    expect(state.phase === 'Choosing' && state.theme).toBeUndefined();
  });

  it('records the theme on the room, so it belongs to everybody rather than to its author', () => {
    const state = reducer(choosingRoom(), {
      type: 'CHOOSE_THEME',
      playerId: 'p1',
      theme: 'Nature',
      at: 1500,
    });
    expect(state.phase === 'Choosing' && state.theme).toBe('Nature');
  });

  it('refuses a press from anybody but the player on turn', () => {
    // The muted cards are a promise the client keeps on its own. This is the host keeping it,
    // so a client that presses every card in turn still only ever changes the room once.
    const state = choosingRoom();
    expect(
      reducer(state, { type: 'CHOOSE_THEME', playerId: 'p2', theme: 'Nature', at: 1500 })
    ).toBe(state);
  });

  it('takes a later press from the turn holder, since a choice can be changed while it is open', () => {
    const once = reducer(choosingRoom(), {
      type: 'CHOOSE_THEME',
      playerId: 'p1',
      theme: 'Nature',
      at: 1500,
    });
    const twice = reducer(once, {
      type: 'CHOOSE_THEME',
      playerId: 'p1',
      theme: 'Music',
      at: 1500,
    });
    expect(twice.phase === 'Choosing' && twice.theme).toBe('Music');
  });

  it('is refused outside Choosing, since there is no bank on screen to answer', () => {
    const writingRoom = reducer(choosingRoom(), writing);
    expect(
      reducer(writingRoom, { type: 'CHOOSE_THEME', playerId: 'p1', theme: 'Nature', at: 1500 })
    ).toBe(writingRoom);
  });

  it('travels to a client, which is the whole point of it being the room answer', () => {
    const state = reducer(choosingRoom(), {
      type: 'CHOOSE_THEME',
      playerId: 'p1',
      theme: 'Nature',
      at: 1500,
    });
    const publicState = toPublicState(state);
    expect(publicState.phase === 'Choosing' && publicState.theme).toBe('Nature');
  });

  it('leaves the field off the wire entirely while the bank is still open', () => {
    // Absent rather than null: the state goes out as plain data, and a client reading it cannot
    // tell an absent theme from a theme named "undefined".
    expect(Object.keys(toPublicState(choosingRoom()))).not.toContain('theme');
  });

  it('rides on into the round, so the bank still shows what is being played', () => {
    const chosen = reducer(choosingRoom(), {
      type: 'CHOOSE_THEME',
      playerId: 'p1',
      theme: 'Nature',
      at: 1500,
    });
    const state = reducer(chosen, writing);
    const publicState = toPublicState(state);
    expect(state.phase === 'Writing' && state.theme).toBe('Nature');
    expect(publicState.phase === 'Writing' && publicState.theme).toBe('Nature');
  });

  it('is cleared for the next round, so a new bank opens with nothing pressed on it', () => {
    const written = reducer(
      reducer(choosingRoom(), {
        type: 'CHOOSE_THEME',
        playerId: 'p1',
        theme: 'Nature',
        at: 1500,
      }),
      writing
    );
    const reviewing = reducer(written, {
      type: 'START_REVIEWING',
      startedAt: 3000,
      durationMs: 90_000,
    });
    const scored = reducer(reviewing, {
      type: 'END_REVIEWING',
      startedAt: 4000,
      durationMs: 15_000,
    });
    const again = reducer(scored, { type: 'NEXT_ROUND', durationMs: 20_000, startedAt: 5000 });
    expect(again.phase === 'Choosing' && again.theme).toBeUndefined();
  });

  it('spends one round of that theme as the card is pressed', () => {
    // The expanded card's own row of ticks has to be one shorter the moment the room commits,
    // on every screen at once, or the row reads as a bar that never drains.
    const state = reducer(choosingRoom(), {
      type: 'CHOOSE_THEME',
      playerId: 'p1',
      theme: 'Nature',
      at: 1500,
    });
    expect([...state.themeRounds]).toEqual([['Nature', 1]]);
  });

  it('spends against a theme already part spent, and leaves the rest of the bank alone', () => {
    const room = { ...choosingRoom(), themeRounds: new Map<ThemeId, number>([['Nature', 3]]) };
    const state = reducer(room, {
      type: 'CHOOSE_THEME',
      playerId: 'p1',
      theme: 'Nature',
      at: 1500,
    });
    expect([...state.themeRounds]).toEqual([['Nature', 4]]);
  });

  it('spends nothing on a press that is refused, since no round was committed', () => {
    const state = choosingRoom();
    const refused = reducer(state, {
      type: 'CHOOSE_THEME',
      playerId: 'p2',
      theme: 'Nature',
      at: 1500,
    });
    expect(refused.themeRounds).toBe(state.themeRounds);
  });

  it('tells a client the counts, since the bank is drawn from them', () => {
    const state = reducer(choosingRoom(), {
      type: 'CHOOSE_THEME',
      playerId: 'p1',
      theme: 'Nature',
      at: 1500,
    });
    expect(toPublicState(state).spent).toEqual([{ theme: 'Nature', rounds: 1 }]);
  });
});
