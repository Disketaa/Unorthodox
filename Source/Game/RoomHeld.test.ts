import { describe, it, expect } from 'vitest';
import { reducer } from './Reducer';
import { freshLobbyState } from './GameState';
import { toPublicState } from './PublicState';
import type { HostState } from './GameState';

function lobby(): HostState {
  const look = { character: 'Butterfly', color: 'Coral' } as const;
  return {
    ...freshLobbyState(),
    players: new Map([['p1', { name: 'Alice', look, isOnline: true }]]),
  };
}

/** A room part way through Writing, which is where a hold is most worth testing. */
function writing(): HostState {
  const started = reducer(lobby(), {
    type: 'START_GAME',
    durationMs: 20_000,
    startedAt: 1000,
  });
  const answered = reducer(started, {
    type: 'CHOOSE_THEME',
    playerId: 'p1',
    theme: 'Music',
    at: 1500,
  });
  return reducer(answered, {
    type: 'START_WRITING',
    topic: 'A topic',
    durationMs: 60_000,
    startedAt: 2000,
  });
}

const held = (at: number) => ({ type: 'PAUSE', at }) as const;

/** When Writing began, which is what a resumed room's clock is measured from. */
function writingStartedAt(): number {
  const state = writing();
  return state.phase === 'Writing' ? state.startedAt : 0;
}

describe('a room held still', () => {
  it('is held where it was, and the room is told', () => {
    const state = reducer(writing(), held(5000));
    expect(state.paused).toBe(true);
    expect(toPublicState(state).paused).toBe(true);
  });

  it('comes back to the second it left, rather than one that ran on while it was held', () => {
    // Ten seconds of hold, moved on by exactly ten: the alternative is a room that loses the
    // time the host spent talking, which is the whole reason for holding it.
    const resumed = reducer(reducer(writing(), held(5000)), {
      type: 'RESUME',
      at: 15000,
    });
    expect(resumed.paused).toBe(false);
    const moved = resumed.phase === 'Writing' ? resumed.startedAt : 0;
    expect(moved - writingStartedAt()).toBe(10_000);
  });

  it('leaves the whole of the phase still to run, not a phase shortened by the hold', () => {
    const resumed = reducer(reducer(writing(), held(5000)), {
      type: 'RESUME',
      at: 15000,
    });
    expect(resumed.phase === 'Writing' && resumed.durationMs).toBe(60_000);
  });

  it('refuses a second hold, which would make the first one read as shorter than it was', () => {
    const once = reducer(writing(), held(5000));
    expect(reducer(once, held(9000))).toBe(once);
  });

  it('refuses to let go a room that was never held', () => {
    const running = writing();
    expect(reducer(running, { type: 'RESUME', at: 9000 })).toBe(running);
  });

  it("moves the answer's reveal and the room's roll on by the same length", () => {
    // Both are counted against on a screen, so a hold that moved only the phase clock would let
    // the room commit a roll it had already been looking at for longer than the round itself.
    const bank = reducer(
      reducer(lobby(), { type: 'START_GAME', durationMs: 20_000, startedAt: 1000 }),
      { type: 'START_RANDOM_PICK', theme: 'Nature', startedAt: 1200 }
    );
    const resolved = reducer(bank, { type: 'RESOLVE_RANDOM_PICK', at: 4000 });
    const resumed = reducer(reducer(resolved, held(5000)), { type: 'RESUME', at: 10_000 });
    const publicState = toPublicState(resumed);
    expect(publicState.phase === 'Choosing' && publicState.answeredAt).toBe(9000);
  });

  it('answers no play at all while it is held', () => {
    const paused = reducer(writing(), held(5000));
    expect(
      reducer(paused, {
        type: 'SUBMIT_ANSWER',
        playerId: 'p1',
        text: 'An answer',
      })
    ).toBe(paused);
    expect(reducer(paused, { type: 'NEXT_ROUND', durationMs: 20_000, startedAt: 9000 })).toBe(
      paused
    );
    expect(reducer(paused, { type: 'FINAL' })).toBe(paused);
  });

  it('will not even let the room answer its own bank while it is held', () => {
    // The roll is the room playing on its own account, so a hold stops it as surely as a press.
    const paused = reducer(writing(), held(5000));
    expect(
      reducer(paused, { type: 'START_RANDOM_PICK', theme: 'Nature', startedAt: 6000 })
    ).toBe(paused);
  });

  it('still takes a player joining, since the roster outlives the game being played', () => {
    const paused = reducer(writing(), held(5000));
    const joined = reducer(paused, {
      type: 'JOIN',
      playerId: 'p2',
      name: 'Bob',
      look: { character: 'Ghost', color: 'Sky' },
    });
    expect(joined.players.size).toBe(2);
    expect(joined.paused).toBe(true);
  });

  it('is not a hold on the next phase, which is a fresh start rather than the same room held on', () => {
    const running = reducer(reducer(writing(), held(5000)), {
      type: 'RESUME',
      at: 6000,
    });
    const scoring = reducer(running, {
      type: 'START_REVIEWING',
      startedAt: 7000,
      durationMs: 90_000,
    });
    expect(scoring.paused).toBe(false);
    expect(scoring.pausedAt).toBeUndefined();
  });
});
