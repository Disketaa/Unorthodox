import { describe, it, expect } from 'vitest';
import { botAnswer, botAnswers, botJoin } from './Bot';
import { createRandom } from '@/Core';
import type { PlayerLook } from '@/Core';
import { GameConfig, reducer } from '@/Game';
import type { HostState } from '@/Game';

const look: PlayerLook = { character: 'Butterfly', color: 'Coral' };

/** A lobby holding these names, one seat each. */
function lobby(...names: string[]): HostState {
  const players = new Map();
  names.forEach((name, index) => {
    players.set(`p${index + 1}`, { name, look, isOnline: true });
  });
  return {
    phase: 'Lobby',
    players,
    cumulativeScores: new Map(),
    turnPlayerId: null,
    pace: 'Standard',
    themeRounds: new Map(),

    paused: false,

    pausedAt: undefined,
  };
}

/** A fixed seed, so a roll is the same on every run and the test means something. */
const seeded = () => createRandom(20261001);

/** How many players it takes to fill the room. */
const full = () =>
  lobby(...Array.from({ length: GameConfig.limits.maxPlayers }, (_, i) => `P${i}`));

describe('botJoin', () => {
  it('joins the lobby under a seat of its own', () => {
    const action = botJoin(lobby('Dan'), 1, seeded());
    expect(action).toMatchObject({ type: 'JOIN', playerId: 'bot1' });
  });

  it('never takes a seat the roster hands to a player', () => {
    const action = botJoin(lobby('Dan'), 2, seeded());
    expect(action?.playerId).not.toBe('p1');
    expect(action?.playerId).not.toBe('host');
  });

  it('never joins under a name the room is already using', () => {
    const first = botJoin(lobby('Dan'), 1, seeded());
    const second = botJoin(lobby('Dan', first?.name ?? ''), 2, seeded());
    expect(second?.name).not.toBe(first?.name);
  });

  it('never joins a full room', () => {
    expect(botJoin(full(), 1, seeded())).toBeUndefined();
  });

  it('never joins once the room has left the lobby', () => {
    const writing: HostState = {
      phase: 'Writing',
      topic: 'Тема',
      durationMs: 1_000,
      startedAt: 0,
      answers: new Map(),
      players: new Map(),
      cumulativeScores: new Map(),
      turnPlayerId: null,
      pace: 'Standard',
      themeRounds: new Map(),

      paused: false,

      pausedAt: undefined,
      theme: undefined,
    };
    expect(botJoin(writing, 1, seeded())).toBeUndefined();
  });
});

/** A round already open, holding these seats. */
function writing(...seats: string[]): HostState {
  const players = new Map();
  seats.forEach((seat) => players.set(seat, { name: seat, look, isOnline: true }));
  return {
    phase: 'Writing',
    topic: 'Тема',
    durationMs: 60_000,
    startedAt: 0,
    answers: new Map(),
    players,
    cumulativeScores: new Map(),
    turnPlayerId: null,
    pace: 'Standard',
    themeRounds: new Map(),

    paused: false,

    pausedAt: undefined,
    theme: undefined,
  };
}

describe('botAnswer', () => {
  it('writes five words off the list', () => {
    const text = botAnswer(seeded());
    expect(text.split(' ')).toHaveLength(5);
  });

  it('fits the field a player types into', () => {
    const text = botAnswer(createRandom(7));
    expect(text.length).toBeLessThanOrEqual(GameConfig.limits.answerMaxLength);
  });

  it('repeats a word, so two bots can land on one answer', () => {
    const answers = Array.from({ length: 60 }, (_, i) => botAnswer(createRandom(i)));
    expect(answers.some((text) => new Set(text.split(' ')).size < 5)).toBe(true);
  });
});

describe('botAnswers', () => {
  it('answers for every bot the round is waiting on, and for nobody else', () => {
    expect(botAnswers(writing('host', 'bot1', 'bot2', 'p1'), seeded())).toMatchObject([
      { type: 'SUBMIT_ANSWER', playerId: 'bot1' },
      { type: 'SUBMIT_ANSWER', playerId: 'bot2' },
    ]);
  });

  it('leaves a bot that has already answered alone', () => {
    const answered = reducer(writing('bot1'), {
      type: 'SUBMIT_ANSWER',
      playerId: 'bot1',
      text: 'уже',
    });
    expect(botAnswers(answered, seeded())).toEqual([]);
  });

  it('answers nothing outside a round', () => {
    expect(botAnswers(lobby('bot1'), seeded())).toEqual([]);
  });
});
