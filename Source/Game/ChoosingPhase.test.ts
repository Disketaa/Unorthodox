import { describe, it, expect } from 'vitest';
import { reducer } from './Reducer';
import { freshLobbyState } from './GameState';
import { toPublicState } from './PublicState';
import type { HostState } from './GameState';

/** A lobby with one player in it, which is the smallest room a game can start in. */
function lobby(): HostState {
  return {
    ...freshLobbyState(),
    players: new Map([
      [
        'p1',
        { name: 'Alice', look: { character: 'Butterfly', color: 'Coral' }, isOnline: true },
      ],
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

describe('the Choosing phase', () => {
  it('is what the lobby becomes when the game starts', () => {
    const state = reducer(lobby(), choosing);
    expect(state.phase).toBe('Choosing');
  });

  it('carries the roster out of the lobby, since a theme is picked by those seated', () => {
    const state = reducer(lobby(), choosing);
    expect(state.phase === 'Choosing' && state.players.size).toBe(1);
    expect(state.turnPlayerId).toBeNull();
  });

  it('holds no topic, because the round has not been given one yet', () => {
    const state = reducer(lobby(), choosing);
    expect(state.phase === 'Choosing' && 'topic' in state).toBe(false);
  });

  it('tells a client its clock and the room, and nothing else', () => {
    const publicState = toPublicState(reducer(lobby(), choosing));
    expect(publicState.phase).toBe('Choosing');
    if (publicState.phase !== 'Choosing') return;
    expect(publicState.durationMs).toBe(20_000);
    expect(publicState.startedAt).toBe(1000);
    expect(publicState.players.map((player) => player.name)).toEqual(['Alice']);
  });

  it('refuses to start from any phase but the lobby', () => {
    const started = reducer(lobby(), choosing);
    expect(reducer(started, choosing)).toBe(started);
  });

  it('refuses to start from an empty room', () => {
    const empty = freshLobbyState();
    expect(reducer(empty, choosing)).toBe(empty);
  });

  it('moves into Writing on a topic, and starts the answers empty', () => {
    const state = reducer(reducer(lobby(), choosing), writing);
    expect(state.phase).toBe('Writing');
    if (state.phase !== 'Writing') return;
    expect(state.topic).toBe('A topic');
    expect(state.answers.size).toBe(0);
    expect(state.players.size).toBe(1);
  });

  it('refuses a topic from any phase but Choosing', () => {
    const empty = lobby();
    expect(reducer(empty, writing)).toBe(empty);
  });

  it('comes round again, so a second round is another Choosing', () => {
    const answered = reducer(reducer(reducer(lobby(), choosing), writing), {
      type: 'SUBMIT_ANSWER',
      playerId: 'p1',
      text: 'An answer',
    });
    const scored = reducer(answered, {
      type: 'START_REVIEWING',
      startedAt: 3000,
      durationMs: 90_000,
    });
    const next = reducer(scored, {
      type: 'END_REVIEWING',
      startedAt: 4000,
      durationMs: 15_000,
    });
    const again = reducer(next, { type: 'NEXT_ROUND', durationMs: 20_000, startedAt: 5000 });
    expect(again.phase).toBe('Choosing');
    // The totals of the round that just scored carry into the choice for the next one.
    expect(again.cumulativeScores.size).toBe(1);
  });
});
