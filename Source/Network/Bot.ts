import { PlayerId, PlayerLook, createLogger, randomLook } from '@/Core';
import type { Random } from '@/Core';
import { GameConfig } from '@/Game';
import type { ActionOf, HostState } from '@/Game';

const log = createLogger('Bot');

/**
 * A player the host invents, for trying a room out with nobody else in it.
 *
 * Debug only, behind the "*" that turns the console on: a bot that got into a real
 * room would be a player nobody asked for and nobody could explain. It joins like
 * anyone else and can be voted for and kicked, but it never answers and nothing
 * waits on it, so a round plays out to the clock with the seat merely sitting there.
 */

/** The names a bot goes by, rolled at random like everything else about it. */
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
] as const;

/** A bot's seat. Never `p<number>`, which is what the roster hands to real players. */
const BotIdPrefix = 'bot';

interface Bot {
  playerId: PlayerId;
  name: string;
  look: PlayerLook;
}

/**
 * A name nothing else in the room is using.
 *
 * The room treats a name as the identity of a seat, so a bot joining under a taken
 * name would land on somebody's chair. Once the names run out the suffix takes over,
 * since a bot called `Аня 3` is still a stranger.
 */
function freeName(random: Random, taken: readonly string[]): string {
  for (let attempt = 0; attempt < names.length; attempt += 1) {
    const name = names[Math.floor(random() * names.length)];
    if (name !== undefined && !taken.includes(name)) return name;
  }
  return `${names[0]} ${taken.length + 1}`;
}

/** Roll one bot: a name, a character, a tint, and a seat nobody can be given. */
function createBot(id: number, random: Random, taken: readonly string[]): Bot {
  return {
    playerId: `${BotIdPrefix}${id}`,
    name: freeName(random, taken),
    look: randomLook(random),
  };
}

/**
 * The join that puts one bot in the lobby, or nothing at all.
 *
 * Nothing rather than a join for a full room, since a bot past the last seat is a
 * roster longer than the room allows and a Start button nobody can trust.
 */
export function botJoin(
  state: HostState,
  id: number,
  random: Random,
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
