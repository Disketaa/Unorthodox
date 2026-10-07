import { describe, it, expect } from 'vitest';
import { nextPlayerInTurn, turnOrder } from './Turns';
import { handleJoin } from './LobbyActions';
import { reducer } from './Reducer';
import { freshLobbyState, type HostState } from './GameState';

const look = { character: 'Butterfly', color: 'Coral' } as const;

/** A lobby holding these names, one seat each, in the order they were given. */
function lobby(...names: string[]): HostState {
  return names.reduce<HostState>(
    (state, name, index) =>
      handleJoin(state, { type: 'JOIN', playerId: `p${index + 1}`, name, look }),
    freshLobbyState()
  );
}

describe('the order turns go in', () => {
  it('is the order the room seated people', () => {
    const state = handleJoin(lobby('Dan', 'Anya'), {
      type: 'JOIN',
      playerId: 'p1',
      name: 'Dan',
      look,
    });
    expect(turnOrder(state.players)).toEqual(['p1', 'p2']);
  });
});

describe('the next turn', () => {
  it('goes to the next player seated', () => {
    expect(nextPlayerInTurn('p1', ['p1', 'p2', 'p3'])).toBe('p2');
  });

  it('wraps round to the first player after the last', () => {
    expect(nextPlayerInTurn('p3', ['p1', 'p2', 'p3'])).toBe('p1');
  });

  it('starts at the first player when nobody holds the turn', () => {
    expect(nextPlayerInTurn(null, ['p1', 'p2'])).toBe('p1');
  });

  it('is nobody at all in an empty room', () => {
    expect(nextPlayerInTurn(null, [])).toBeNull();
  });

  it('falls to the first player when the holder has left the room', () => {
    // The holder is not coming back to the turn, and starting from the top is the one answer
    // that never asks the room to wait on a seat that is not there.
    expect(nextPlayerInTurn('gone', ['p1', 'p2'])).toBe('p1');
  });

  it('skips a player who is not seated rather than stopping on them', () => {
    expect(nextPlayerInTurn('p1', ['p1', 'p3'])).toBe('p3');
  });
});

describe('the turn in a room', () => {
  it('starts with nobody holding it', () => {
    expect(lobby('Dan', 'Anya').turnPlayerId).toBeNull();
  });

  it('is held by the next player when the host hands it on', () => {
    const state = reducer(lobby('Dan', 'Anya'), { type: 'NEXT_TURN' });
    expect(state.turnPlayerId).toBe('p1');
  });

  it('walks the roster round and round', () => {
    let state = lobby('Dan', 'Anya', 'Kai');
    const held = [state.turnPlayerId];
    for (let step = 0; step < 4; step += 1) {
      state = reducer(state, { type: 'NEXT_TURN' });
      held.push(state.turnPlayerId);
    }
    expect(held).toEqual([null, 'p1', 'p2', 'p3', 'p1']);
  });

  it("survives a change of phase, since a turn is the room's and not the round's", () => {
    const started = reducer(reducer(lobby('Dan', 'Anya'), { type: 'NEXT_TURN' }), {
      type: 'START_GAME',
      durationMs: 1000,
      startedAt: 0,
    });
    expect(started.phase).toBe('Choosing');
    expect(started.turnPlayerId).toBe('p1');
  });
});
