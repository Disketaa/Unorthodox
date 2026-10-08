import { describe, it, expect } from 'vitest';
import { reducer } from './Reducer';
import { freshLobbyState } from './GameState';
import { toPublicState } from './PublicState';
import { GameConfig } from './GameConfig';
import type { HostState } from './GameState';
import type { PublicChoosingState } from './PublicState';

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

function openBank(): HostState {
  return reducer(lobby(), {
    type: 'START_GAME',
    durationMs: GameConfig.paces.Standard.categoryMs,
    startedAt: 1000,
  });
}

/** One round started from the bank, then scored, which is the whole way from a press to the next
 * bank being open. Written once because four of these tests walk the same road. */
function startRound(answered: HostState): HostState {
  const writing = reducer(answered, {
    type: 'START_WRITING',
    topic: 'A topic',
    durationMs: 60_000,
    startedAt: 3000,
  });
  return reducer(
    reducer(writing, { type: 'START_REVIEWING', startedAt: 4000, durationMs: 90_000 }),
    { type: 'END_REVIEWING', startedAt: 5000, durationMs: 15_000 }
  );
}

const press = (theme: 'Music' | 'Nature', at = 1500) =>
  ({ type: 'CHOOSE_THEME', playerId: 'p1', theme, at }) as const;

function told(state: HostState): PublicChoosingState {
  const publicState = toPublicState(state);
  if (publicState.phase !== 'Choosing') throw new Error('not choosing');
  return publicState;
}

describe('a bank that has been answered', () => {
  it('records when it was answered, which is where its clock stops', () => {
    expect(told(reducer(openBank(), press('Music'))).answeredAt).toBe(1500);
  });

  it('sends that moment to the room, so every screen stops counting down on the same one', () => {
    expect(told(reducer(openBank(), press('Nature'))).answeredAt).toBe(1500);
  });

  it('leaves a bank nobody has answered on its own clock', () => {
    expect(told(openBank()).answeredAt).toBeUndefined();
  });

  it('moves the moment with a second press, so changing the answer restarts the hold', () => {
    // A choice can be changed while it is open, and the card it is shown on is only held for as
    // long as that card has been the answer.
    const changed = reducer(reducer(openBank(), press('Music', 1500)), press('Nature', 1900));
    expect(told(changed).answeredAt).toBe(1900);
    expect(told(changed).theme).toBe('Nature');
  });

  it("is stopped at the room's roll too, which is an answer nobody pressed for", () => {
    const swept = reducer(
      reducer(openBank(), {
        type: 'START_RANDOM_PICK',
        theme: 'Nature',
        startedAt: 1500,
      }),
      { type: 'RESOLVE_RANDOM_PICK', at: 2500 }
    );
    expect(told(swept).answeredAt).toBe(2500);
  });

  it("keeps a fresh bank off the old one's stop, since the counts carry but the clock does not", () => {
    const answered = reducer(openBank(), press('Music'));
    const writing = reducer(answered, {
      type: 'START_WRITING',
      topic: 'A topic',
      durationMs: 60_000,
      startedAt: 3000,
    });
    const scored = reducer(
      reducer(writing, { type: 'START_REVIEWING', startedAt: 4000, durationMs: 90_000 }),
      { type: 'END_REVIEWING', startedAt: 5000, durationMs: 15_000 }
    );
    const again = reducer(scored, { type: 'NEXT_ROUND', durationMs: 20_000, startedAt: 6000 });
    expect(again.phase === 'Choosing' && again.answeredAt).toBeUndefined();
    // The spent count does carry, or the card would refill its row of ticks every round.
    expect([...again.themeRounds]).toEqual([['Music', 1]]);
  });
});

describe('the turn around the bank', () => {
  it('is handed on as the round starts, which is the only moment it can be', () => {
    const answered = reducer(openBank(), press('Music'));
    expect(answered.turnPlayerId).toBe('p1');
    const writing = reducer(answered, {
      type: 'START_WRITING',
      topic: 'A topic',
      durationMs: 60_000,
      startedAt: 3000,
    });
    expect(writing.turnPlayerId).toBe('p2');
  });

  it("is the next seat's when the next bank opens, and comes round to the first after that", () => {
    // The turn moved as the round started, so the bank that opens next is the next seat's.
    const next = reducer(startRound(reducer(openBank(), press('Music'))), {
      type: 'NEXT_ROUND',
      durationMs: 20_000,
      startedAt: 6000,
    });
    expect(next.phase === 'Choosing' && next.turnPlayerId).toBe('p2');
    const again = startRound(next);
    expect(again.turnPlayerId).toBe('p1');
  });

  it('stays with the player whose turn it was while the bank is still open', () => {
    // The turn is what limits a press, so it may not move before the round that used it starts.
    expect(reducer(openBank(), press('Nature')).turnPlayerId).toBe('p1');
  });
});
