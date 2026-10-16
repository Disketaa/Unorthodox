/** What one round's bank of theme cards carries, rolled rather than sent. An arrangement every
 * player has to see identically cannot come from one player's roll, and the deal of themes and
 * the question deck above already settle that by seeding from the room's own four letters. */
import {
  LetterPair,
  LetterPairs,
  ThemeEffectId,
  ThemeEnchantId,
  ThemeRef,
  ThemeModifierId,
  randomFor,
  sampleUnique,
  themesForRoom,
} from '@/Core';
import { GameConfig } from './GameConfig';

/** The modifiers this round's bank carries, by the theme carrying them. A theme carrying none is
 * left out rather than mapped to an empty list, since a bank with nothing enchanted is a real
 * answer and a caller should not read six empty lists to find that out. */
export function modifiersForRound(
  roomCode: string,
  themes: readonly ThemeRef[],
  round: number
): ReadonlyMap<ThemeRef, readonly ThemeModifierId[]> {
  const rule = GameConfig.themes.modifiers;
  const random = randomFor(`${roomCode}:modifiers:${round}`);
  const enchanted = new Map<ThemeRef, readonly ThemeModifierId[]>();
  if (random() >= rule.chance) return enchanted;
  const count = 1 + Math.floor(random() * Math.min(rule.maxPerRound, themes.length));
  for (const theme of sampleUnique(themes, count, random)) {
    const effect =
      GameConfig.themes.modifiers.effects[
        Math.floor(random() * GameConfig.themes.modifiers.effects.length)
      ];
    enchanted.set(theme, ['Enchanted', effect]);
  }
  return enchanted;
}

/** Multiplier rolled per theme from room/round seed. */
export function multForTheme(roomCode: string, theme: ThemeRef, round: number): number {
  const random = randomFor(`${roomCode}:mult:${round}:${theme}`);
  return GameConfig.themes.mults[Math.floor(random() * GameConfig.themes.mults.length)];
}

/** How many rounds the room has played, counted off the per-theme counts every phase carries.
 * Counted rather than kept as a counter of its own, since those are what the state holds and a
 * second number in it could drift away from them. */
export function roundsPlayed(spent: readonly { rounds: number }[] | undefined): number {
  if (spent === undefined) return 0;
  let total = 0;
  for (const entry of spent) total += entry.rounds;
  return total;
}

/** Nothing banned, which is what a round whose theme carries no enchantment gives. */
const NoLetters: readonly LetterPair[] = [];

/** What the round's enchantment does to the answer being written: the spread it carries, which
 * of the four enchants it rolled, and either the letters it has something to say about or the
 * length it holds the answer to. */
export function enchantmentFor(
  roomCode: string,
  theme: ThemeRef | undefined,
  spent: readonly { rounds: number }[] | undefined
): EnchantmentRoll {
  if (theme === undefined) return NoEnchantment;
  // The round the bank was offered in: the pick is counted the moment it lands, so rolling
  // against the round after it would be a different set of cards.
  const bankRound = Math.max(0, roundsPlayed(spent) - 1);
  const themes = themesForRoom(roomCode, GameConfig.themes.cardsPerLobby);
  const carried = modifiersForRound(roomCode, themes, bankRound).get(theme);
  if (carried?.includes('Enchanted') !== true) return NoEnchantment;
  const effect = carried.find((id): id is ThemeEffectId => id !== 'Enchanted');
  // Which of the four the card carries, rolled off the room's own seed rather than this player's:
  // the enchantment is the room's fact, and two players drawing two of them would put two
  // different rounds under the same card.
  const roll = randomFor(`${roomCode}:enchant:${bankRound}:${theme}`);
  const enchants = GameConfig.themes.enchants;
  const enchant = enchants[Math.floor(roll() * enchants.length)];
  const mult = multForTheme(roomCode, theme, bankRound);
  // The two length enchants ask about how long the answer is rather than which letters it holds,
  // so they read their own tables and come with a figure instead of a letter.
  if (enchant === 'MinLength' || enchant === 'MaxLength') {
    const bounds = GameConfig.themes.lengthBounds[enchant === 'MinLength' ? 'min' : 'max'];
    return { effect, enchant, letters: NoLetters, bound: bounds[mult], mult };
  }
  // Which table of counts the other two read decides how much they ask for, so it is asked after
  // the enchantment is known rather than before.
  const table =
    enchant === 'Demand' ? GameConfig.themes.demandCounts : GameConfig.themes.letterCounts;
  const count = table[mult];
  if (count === undefined || count <= 0) return { ...NoEnchantment, effect, enchant, mult };
  // Drawn off the room's own seed too, so every tab is held to the same letters: a player who
  // switched device would otherwise be playing a different round from the one the room is on.
  const letters = sampleUnique(
    LetterPairs,
    count,
    randomFor(`${roomCode}:letters:${bankRound}:${theme}`)
  );
  return { effect, enchant, letters, bound: undefined, mult };
}

/** What one round's enchantment is, as the game rolls it. */
export interface EnchantmentRoll {
  effect: ThemeEffectId | undefined;
  enchant: ThemeEnchantId | undefined;
  letters: readonly LetterPair[];
  /** The figure a length enchantment holds the answer to, absent where it asks about letters. */
  bound: number | undefined;
  /** The multiplier the card wears, which is what the bar shows at its head: the one number that
   * says how hard the round's enchantment was rolled. */
  mult: number | undefined;
}

/** A round whose theme is not enchanted: nothing carried, nothing asked, nothing drawn. */
const NoEnchantment = {
  effect: undefined,
  enchant: undefined,
  letters: NoLetters,
  bound: undefined,
  mult: undefined,
};
