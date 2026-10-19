import { describe, it, expect } from 'vitest';
import { reducer } from './Reducer';
import { scoreRound } from './RoundScoring';
import { freshLobbyState } from './GameState';
import type { WritingState } from './GameState';
import type { PlayerLook } from '@/Core';

const look: PlayerLook = { character: 'Ghost', color: 'Sky' };

/** A round being written, with the room in it. */
function writing(): WritingState {
  return {
    phase: 'Writing',
    players: new Map([
      ['p1', { name: 'A', look, isOnline: true }],
      ['p2', { name: 'B', look, isOnline: true }],
      ['p3', { name: 'C', look, isOnline: true }],
    ]),
    cumulativeScores: new Map(),
    turnPlayerId: null,
    pace: 'Standard',
    themes: [],
    themeMode: 'Random',
    themeRounds: new Map(),
    paused: false,
    pausedAt: undefined,
    topic: 'a topic',
    durationMs: 60_000,
    startedAt: 0,
    answers: new Map([['p2', 'что-то']]),
    answerShares: new Map([['p2', 0.5]]),
    mult: 1,
    theme: undefined,
  };
}

/** One press of the submit button. Sending an answer never takes the room out of Writing, so the
 * state it hands back is the round it wrote into. */
function submit(text: string, playerId = 'p1'): WritingState {
  const state = reducer(writing(), {
    type: 'SUBMIT_ANSWER',
    playerId,
    text,
    at: 30_000,
  });
  if (state.phase !== 'Writing') throw new Error('submitting left the room writing');
  return state;
}

describe('what a player who wrote nothing sends', () => {
  it('is not an answer, and pays them nothing', () => {
    // An empty answer used to become a card like any other: it had a writer and a moment, so the
    // speed curve read it as the fastest answer in the round and paid it in full. A player sitting
    // every round out was paid for the rounds they sat out.
    const answered = submit('');
    expect(answered.phase === 'Writing' ? answered.answers.has('p1') : true).toBe(false);
    const { roundScores } = scoreRound(answered);
    expect(roundScores.get('p1')).toBeUndefined();
  });

  it('does not group every player who wrote nothing into one card', () => {
    // Two empty answers match each other, so they were one card with two writers on it — drawn as a
    // shared answer rather than as the blank card, which is a different thing to say about a round
    // that two players sat out together.
    const two = submit('', 'p3');
    const grouped = scoreRound(two).roundScores;
    expect(grouped.has('p1')).toBe(false);
    expect(grouped.has('p3')).toBe(false);
    expect(grouped.size).toBe(1);
  });

  it('leaves a player who wrote nothing in no group at all, so the blank card is what draws them', () => {
    // The blank card is drawn for exactly this player: no card of their own, and the sentence on
    // it saying so. Nothing about them is on the board except that.
    const answered = submit('   ');
    const cards = scoreRound(answered);
    expect(cards.roundScores.get('p2')).toBeGreaterThan(0);
  });

  it('keeps the answer a player had already sent when they clear it', () => {
    // The room is already holding it. Taking it away would be a card that said something and then
    // said nothing, which is a card the room cannot read.
    const sent = submit('было');
    const cleared = reducer(sent, {
      type: 'SUBMIT_ANSWER',
      playerId: 'p1',
      text: '',
      at: 40_000,
    });
    expect(cleared.phase === 'Writing' ? cleared.answers.get('p1') : undefined).toBe('было');
  });

  it('still takes an answer with spaces round it', () => {
    expect(freshLobbyState().phase).toBe('Lobby');
    const sent = submit('  да  ');
    expect(sent.phase === 'Writing' ? sent.answers.get('p1') : undefined).toBe('да');
  });
});
