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
    themes: [],
    themeMode: 'Random',
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
      themes: [],
      themeMode: 'Random',
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
    themes: [],
    themeMode: 'Random',
    themeRounds: new Map(),

    paused: false,

    pausedAt: undefined,
    theme: undefined,
  };
}

describe('botAnswer', () => {
  it('writes one or two words off the list', () => {
    // Mostly one, since a bot is furniture and the round is scored on duplicates, but not always
    // one: a board where every card is a single short word is a board that looks like a test.
    const lengths = new Set(
      Array.from({ length: 200 }, (_, draw) => botAnswer(createRandom(draw)).split(' ').length)
    );
    expect([...lengths].sort()).toEqual([1, 2]);
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

  it('writes words of the lengths the list claims they are', () => {
    // Two letters to ten, in two languages, and nothing either side of that: a word past ten runs
    // the second word out of the field, and a bot whose answer is always one size is not a bot
    // in a room. The spread is what puts the fitting on a card to work.
    const drawn = Array.from({ length: 400 }, (_, draw) =>
      botAnswer(createRandom(draw))
    ).flatMap((answer) => answer.split(' '));
    expect(Math.min(...drawn.map((word) => word.length))).toBeGreaterThanOrEqual(2);
    expect(Math.max(...drawn.map((word) => word.length))).toBeLessThanOrEqual(10);
  });

  it('lands on the same word as another bot often enough to make a duplicate group', () => {
    // The room is scored on duplicates, so what has to hold is that a room of bots lands on one
    // another somewhere: no single room of eleven has to, since some of them write two words.
    // Sampled over rooms rather than argued, since what has to hold is that it happens.
    const rooms = Array.from({ length: 20 }, (_, room) =>
      Array.from({ length: 11 }, (_, seat) => botAnswer(createRandom(room * 11 + seat)))
    );
    expect(rooms.some((answers) => new Set(answers).size < answers.length)).toBe(true);
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
