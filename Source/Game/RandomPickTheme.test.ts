import { describe, it, expect } from 'vitest';
import { reducer } from './Reducer';
import { freshLobbyState } from './GameState';
import { toPublicState } from './PublicState';
import type { PublicChoosingState } from './PublicState';
import type { HostState } from './GameState';

function lobby(): HostState {
  const look = { character: 'Butterfly', color: 'Coral' } as const;
  return {
    ...freshLobbyState(),
    players: new Map([['p1', { name: 'Alice', look, isOnline: true }]]),
  };
}

const choosing = { type: 'START_GAME', durationMs: 20_000, startedAt: 1000 } as const;
const roll = { type: 'START_RANDOM_PICK', theme: 'Nature', startedAt: 1500 } as const;

/** The bank as a client is told about it, which is where the roll has to be visible from. */
function told(state: HostState): PublicChoosingState {
  const publicState = toPublicState(state);
  if (publicState.phase !== 'Choosing') throw new Error('not choosing');
  return publicState;
}

function openBank(): HostState {
  return reducer(lobby(), choosing);
}

describe('a bank nobody answered', () => {
  it('is held back rather than answered, so the cards are still a bank', () => {
    // The whole reason the answer is not `theme` at once: a card that expanded under the sweep
    // would take the bank out from under the very thing that is looking at it.
    const state = reducer(openBank(), roll);
    expect(state.phase === 'Choosing' && state.picking).toEqual({
      theme: 'Nature',
      startedAt: 1500,
    });
    expect(state.phase === 'Choosing' && state.theme).toBeUndefined();
  });

  it('sends the roll but not its answer, since a client cannot sweep a theme it was not given', () => {
    const state = told(reducer(openBank(), roll));
    expect(state.picking).toEqual({ theme: 'Nature', startedAt: 1500 });
    expect(state.theme).toBeUndefined();
  });

  it('is refused once the room has already been answered, since a roll cannot un-answer it', () => {
    const answered = reducer(openBank(), { type: 'CHOOSE_THEME', playerId: 'p1', theme: 'Music', at: 1500 });
    expect(reducer(answered, roll)).toBe(answered);
  });

  it('is refused twice, since two rolls are two answers to one bank', () => {
    const once = reducer(openBank(), roll);
    expect(reducer(once, roll)).toBe(once);
  });

  it('is refused outside Choosing, where there is no bank to answer', () => {
    const other = reducer(openBank(), {
      type: 'START_WRITING',
      topic: 'A topic',
      durationMs: 60_000,
      startedAt: 2000,
    });
    expect(reducer(other, roll)).toBe(other);
  });

  it('commits its theme and spends a round, which is the same answer a press gives', () => {
    const settled = reducer(reducer(openBank(), roll), { type: 'RESOLVE_RANDOM_PICK', at: 2500 });
    expect(settled.phase === 'Choosing' && settled.theme).toBe('Nature');
    expect([...settled.themeRounds]).toEqual([['Nature', 1]]);
    expect(told(settled).picking).toBeUndefined();
  });

  it('travels to a client as a room answer, on every screen at once', () => {
    const settled = reducer(reducer(openBank(), roll), { type: 'RESOLVE_RANDOM_PICK', at: 2500 });
    expect(told(settled).theme).toBe('Nature');
  });

  it('cannot be committed before there was one, which would be a theme out of nowhere', () => {
    const bank = openBank();
    expect(reducer(bank, { type: 'RESOLVE_RANDOM_PICK', at: 2500 })).toBe(bank);
  });

  it('is ended by a press from the turn holder, who does not have to wait for the room to decide', () => {
    // The seat that ignored the clock beating the room's roll is the better outcome, so the press
    // takes the bank and the roll is dropped rather than landing on top of the answer.
    const answered = reducer(reducer(openBank(), roll), {
      type: 'CHOOSE_THEME',
      playerId: 'p1',
      theme: 'Music', at: 1500,
    });
    expect(told(answered).theme).toBe('Music');
    expect(told(answered).picking).toBeUndefined();
  });

  it('spends one round on whichever theme it lands on, not on the room\'s roll for nothing', () => {
    const answered = reducer(reducer(openBank(), roll), {
      type: 'CHOOSE_THEME',
      playerId: 'p1',
      theme: 'Music', at: 1500,
    });
    expect([...answered.themeRounds]).toEqual([['Music', 1]]);
  });

  it('is cleared for the next round, since the last roll belonged to the round it answered', () => {
    const committed = reducer(reducer(openBank(), roll), { type: 'RESOLVE_RANDOM_PICK', at: 2500 });
    const writing = reducer(committed, {
      type: 'START_WRITING',
      topic: 'A topic',
      durationMs: 60_000,
      startedAt: 2000,
    });
    const scored = reducer(
      reducer(writing, {
        type: 'START_REVIEWING',
        startedAt: 3000,
        durationMs: 90_000,
      }),
      { type: 'END_REVIEWING', startedAt: 4000, durationMs: 15_000 }
    );
    const again = reducer(scored, { type: 'NEXT_ROUND', durationMs: 20_000, startedAt: 5000 });
    expect(again.phase === 'Choosing' && again.picking).toBeUndefined();
  });
});
