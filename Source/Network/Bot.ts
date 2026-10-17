/** A player the host invents, for trying a room out with nobody else in it. Debug only, behind
 * the `*` that turns the console on: a bot that got into a real room would be a player nobody
 * asked for. It joins like anyone else but never answers and nothing waits on it. */
import { answerWords } from './BotWords';

import { PlayerId, PlayerLook, createLogger, randomLook } from '@/Core';
import type { Random } from '@/Core';
import { GameConfig } from '@/Game';
import type { ActionOf, HostState } from '@/Game';

const log = createLogger('Bot');

/** The names a bot goes by, rolled at random like everything else about it. Written to stress
 * the bar rather than to sound like a room: truncated, non-Latin, one letter, emoji, caps. The
 * bar's slot has to survive a real name, and a bot is the only player nobody types. */
const names = [
  'Аня',
  'Боря',
  'Вера',
  'Гоша',
  'Дина',
  'Егор',
  'Жанна',
  'Кира',
  'Лёша',
  'Мила',
  'Нина',
  'Олег',
  'Ян',
  'Ёж',
  'Боб',
  'Кот',
  'Пёс',
  'Соня',
  'Тимур',
  'Римма',
  'Константинтинтинтинтин',
  'Александра',
  'Полина',
  'Анна-Мария',
  'Императрица',
  'А',
  'Ы',
  'Bob',
  'Grace',
  'ZYZZYVA',
  'Ægir',
  'Ǟlice',
  'MiXeD CaSe',
  'Ō-sama',
  '李雷',
  '😀',
  '🕶',
  'Æon',
] as const;

/** A bot's seat. Never `p<number>`, which is what the roster hands to real players. */
const BotIdPrefix = 'bot';

/** How many draws out of three add a second word. Mostly one, since the round is scored on
 * duplicates and a room full of bots writing phrases leaves nothing to score. Some of the time
 * two, because one short word on every card is a board that looks like a test. */
const SecondWordOdds = 3;

interface Bot {
  playerId: PlayerId;
  name: string;
  look: PlayerLook;
}

/** A name nothing else in the room is using. The room treats a name as the identity of a seat,
 * so a bot joining under a taken name would land on somebody's chair. Once the names run out
 * the suffix takes over. */
function freeName(random: Random, taken: readonly string[]): string {
  for (let attempt = 0; attempt < names.length; attempt += 1) {
    const name = names[Math.floor(random() * names.length)];
    if (name !== undefined && !taken.includes(name)) return name;
  }
  return `${names[0]} ${taken.length + 1}`;
}

/** The number out of a bot's seat, or zero for anything that is not a bot. Counted from the room
 * rather than remembered, because the room is what survives a refresh of the host and a counter
 * would not. */
export function botNumber(playerId: PlayerId): number {
  return playerId.startsWith(BotIdPrefix) ? Number(playerId.slice(BotIdPrefix.length)) || 0 : 0;
}

/** How many bots are already in the room, so the next one is not handed a taken seat. Counted
 * from the roster rather than the lobby, because that is where a resumed room keeps them: a bot
 * handed a taken seat would be two players wearing one name. */
export function botsIn(state: HostState): number {
  return [...state.players.keys()].reduce((highest, id) => Math.max(highest, botNumber(id)), 0);
}

/** What one bot writes: one word off the list, or now and then two, drawn with repetition since
 * two bots landing on the same word is the duplicate group the room scores like any other. The
 * second word is dropped rather than truncated when the pair will not fit the field. */
export function botAnswer(random: Random): string {
  const first = word(random);
  if (Math.floor(random() * SecondWordOdds) !== 0) return first;
  const second = word(random);
  return `${first} ${second}`.length <= GameConfig.limits.answerMaxLength
    ? `${first} ${second}`
    : first;
}

/** One word off the list. The index is taken off the end rather than trusted to land inside it:
 * a generator that reaches exactly one would write `undefined` into the list's place and the
 * bot would submit an empty answer, which is what a bot sitting out the round looks like. */
function word(random: Random): string {
  return (
    answerWords[Math.min(Math.floor(random() * answerWords.length), answerWords.length - 1)] ??
    ''
  );
}

/** The answer each bot in the room still owes, for a round that has just opened. A bot that has
 * already answered is left out, so a host that answers late does not have its seat written over
 * a second time by a move nobody pressed. */
export function botAnswers(
  state: HostState,
  random: Random,
  at: number = Date.now()
): ActionOf<'SUBMIT_ANSWER'>[] {
  if (state.phase !== 'Writing') return [];
  const actions: ActionOf<'SUBMIT_ANSWER'>[] = [];
  for (const playerId of state.players.keys()) {
    if (botNumber(playerId) === 0 || state.answers.has(playerId)) continue;
    actions.push({ type: 'SUBMIT_ANSWER', playerId, text: botAnswer(random), at });
  }
  return actions;
}

/** Roll one bot: a name, a character, a tint, and a seat nobody can be given. */
function createBot(id: number, random: Random, taken: readonly string[]): Bot {
  return {
    playerId: `${BotIdPrefix}${id}`,
    name: freeName(random, taken),
    look: randomLook(random),
  };
}

/** The join that puts one bot in the lobby, or nothing at all. Nothing rather than a join for a
 * full room, since a bot past the last seat is a roster longer than the room allows and a Start
 * button nobody can trust. */
export function botJoin(
  state: HostState,
  id: number,
  random: Random
): ActionOf<'JOIN'> | undefined {
  if (state.phase !== 'Lobby' || state.players.size >= GameConfig.limits.maxPlayers) {
    log('warn', 'no room for a bot right now');
    return undefined;
  }
  const taken = [...state.players.values()].map((player) => player.name);
  const bot = createBot(id, random, taken);
  log('info', 'adding bot', bot.name, bot.playerId);
  return { type: 'JOIN', playerId: bot.playerId, name: bot.name, look: bot.look };
}
