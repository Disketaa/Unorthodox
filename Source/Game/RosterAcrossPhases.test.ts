import { describe, it, expect } from 'vitest';
import { PlayerLook } from '@/Core';
import { reducer } from './Reducer';
import { toPublicState } from './PublicState';
import type { HostState } from './GameState';
import type { PublicState } from './PublicState';

const look: PlayerLook = { character: 'Butterfly', color: 'Coral' };

/** A room of two, in the lobby, so every phase below starts from the same roster. */
function lobby(): HostState {
  return {
    phase: 'Lobby',
    players: new Map([
      ['p1', { name: 'Аня', look, isOnline: true }],
      ['p2', { name: 'Боря', look, isOnline: true }],
    ]),
    cumulativeScores: new Map(),
    turnPlayerId: null,
    pace: 'Standard',
    themeRounds: new Map(),

    paused: false,

    pausedAt: undefined,
  };
}

/** That room, a round in, with both answers written. */
function writing(): HostState {
  const started = reducer(
    reducer(lobby(), { type: 'START_GAME', durationMs: 20_000, startedAt: 0 }),
    {
      type: 'START_WRITING',
      topic: 'Два слова',
      durationMs: 60_000,
      startedAt: 0,
    }
  );
  const answered = reducer(started, {
    type: 'SUBMIT_ANSWER',
    playerId: 'p1',
    text: 'два слова',
  });
  const end = reducer(answered, { type: 'START_REVIEWING', startedAt: 1, durationMs: 90_000 });
  return reducer(end, { type: 'END_REVIEWING', startedAt: 2, durationMs: 15_000 });
}

/** The players a client is shown, in every phase there is. */
function playersIn(state: PublicState) {
  return state.players.map((player) => player.name);
}

describe('the roster a client is shown', () => {
  it('is there in the lobby, as it always was', () => {
    expect(playersIn(toPublicState(lobby()))).toEqual(['Аня', 'Боря']);
  });

  it('is there while the room is writing', () => {
    // The bar of players runs across the whole game, and a client that refreshed
    // mid-round is handed the room back by this rather than by anything it remembered.
    const writing = reducer(
      reducer(lobby(), { type: 'START_GAME', durationMs: 20_000, startedAt: 0 }),
      {
        type: 'START_WRITING',
        topic: 'Два слова',
        durationMs: 60_000,
        startedAt: 0,
      }
    );
    expect(playersIn(toPublicState(writing))).toEqual(['Аня', 'Боря']);
  });

  it('is there on the scores, with the running totals beside it', () => {
    const publicState = toPublicState(writing());
    expect(playersIn(publicState)).toEqual(['Аня', 'Боря']);
    // Only the player who answered has a total, which is the point of the extra field:
    // the bar reads a total where there is one and shows nothing where there is not.
    expect(publicState.phase === 'Scores' ? publicState.cumulative.length : 0).toBe(1);
  });

  it('is there on the last table of the game', () => {
    const final = reducer(writing(), { type: 'FINAL' });
    expect(playersIn(toPublicState(final))).toEqual(['Аня', 'Боря']);
  });

  it('says who is still on the line, which only the host can see change', () => {
    const dropped = reducer(writing(), { type: 'SET_ONLINE', playerId: 'p2', isOnline: false });
    const players = toPublicState(dropped).players;
    expect(players.map((player) => [player.name, player.isOnline])).toEqual([
      ['Аня', true],
      ['Боря', false],
    ]);
  });
});

describe('a player the host has lost', () => {
  it('is recorded outside the lobby too, and kept in the room', () => {
    // The seat is still theirs, so a dropped player is held back rather than removed:
    // the bar would otherwise read as a smaller room instead of a player who left.
    const dropped = reducer(writing(), { type: 'SET_ONLINE', playerId: 'p2', isOnline: false });
    expect(dropped.players.size).toBe(2);
    expect(dropped.players.get('p2')?.isOnline).toBe(false);
  });

  it('comes back online by joining again, keeping the character it had', () => {
    const dropped = reducer(writing(), { type: 'SET_ONLINE', playerId: 'p2', isOnline: false });
    const back = reducer(dropped, {
      type: 'JOIN',
      playerId: 'p2',
      name: 'Другое имя',
      look: { character: 'Ghost', color: 'Sky' },
    });

    // The room's record of a player is not rewritten by a join from the other end of the
    // room, so a refresh cannot rename a player or repaint their face.
    expect(back.players.get('p2')?.name).toBe('Боря');
    expect(back.players.get('p2')?.look).toEqual(look);
    expect(back.players.get('p2')?.isOnline).toBe(true);
  });

  it('is out of the room when the host says so, mid-round included', () => {
    const kicked = reducer(writing(), { type: 'KICK', playerId: 'p2' });
    expect(kicked.players.size).toBe(1);
    expect(kicked.cumulativeScores.has('p2')).toBe(false);
  });
});
