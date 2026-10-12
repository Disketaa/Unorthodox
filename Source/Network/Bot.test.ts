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
  it('writes one word off the list', () => {
    // A bot that filled its length with words would match nobody, and the round is scored on
    // duplicates. One word out of fifteen is how a bot lands in the same group as another bot.
    const text = botAnswer(seeded());
    expect(text.split(' ')).toHaveLength(1);
  });

  it('fits the field a player types into', () => {
    const text = botAnswer(createRandom(7));
    expect(text.length).toBeLessThanOrEqual(GameConfig.limits.answerMaxLength);
  });

  it('writes a word short enough to always fit, whatever it drew', () => {
    // The field is the whole constraint on the list: every word on it has to land inside the
    // answer length whatever the bot happened to write, and a word too long would be cut in half
    // by the field rather than by the room.
    for (let draw = 0; draw < 200; draw += 1) {
      expect(botAnswer(createRandom(draw)).length).toBeLessThanOrEqual(
        GameConfig.limits.answerMaxLength
      );
    }
  });

  it('writes words of the length the list claims they are', () => {
    // Three letters is what keeps a bot's answer short enough to land inside the field and the
    // same size on every card, which is what a bot is for. A four-letter word on the list would
    // still fit the field but would not be the thing the list says it is.
    for (let draw = 0; draw < 200; draw += 1) {
      expect(botAnswer(createRandom(draw))).toHaveLength(3);
    }
  });

  it('lands on the same word as another bot often enough to make a duplicate group', () => {
    // Fifteen words and a full room of eleven bots: the room is scored on duplicates, so the list
    // is only wide enough if two of them land on the same one. Sampled rather than argued, since
    // what has to hold is that it happens, not how often.
    const answers = Array.from({ length: 11 }, (_, i) => botAnswer(createRandom(i)));
    expect(new Set(answers).size).toBeLessThan(answers.length);
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
