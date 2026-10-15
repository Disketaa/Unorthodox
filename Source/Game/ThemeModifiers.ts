/** What one round's bank of theme cards carries, rolled rather than sent. An arrangement every
 * player has to see identically cannot come from one player's roll, and the deal of themes and
 * the question deck above already settle that by seeding from the room's own four letters. */
import {
  LetterPair,
  LetterPairs,
  ThemeEffectId,
  ThemeId,
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
  themes: readonly ThemeId[],
  round: number
): ReadonlyMap<ThemeId, readonly ThemeModifierId[]> {
  const rule = GameConfig.themes.modifiers;
  const random = randomFor(`${roomCode}:modifiers:${round}`);
  const enchanted = new Map<ThemeId, readonly ThemeModifierId[]>();
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
export function multForTheme(roomCode: string, theme: ThemeId, round: number): number {
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

/** What the round's enchantment does to the answer being written: which effect the card carries
 * and the letters it bans. Rolled from the room's seed, so every screen sees the same thing.
 * The effect comes back as its id rather than its name, since the words are the content's. */
export function enchantmentFor(
  roomCode: string,
  theme: ThemeId | undefined,
  spent: readonly { rounds: number }[] | undefined
): { effect: ThemeEffectId | undefined; banned: readonly LetterPair[] } {
  if (theme === undefined) return { effect: undefined, banned: NoLetters };
  // The round the bank was offered in: the pick is counted the moment it lands, so rolling
  // against the round after it would be a different set of cards.
  const bankRound = Math.max(0, roundsPlayed(spent) - 1);
  const themes = themesForRoom(roomCode, GameConfig.themes.cardsPerLobby);
  const carried = modifiersForRound(roomCode, themes, bankRound).get(theme);
  if (carried?.includes('Enchanted') !== true) return { effect: undefined, banned: NoLetters };
  const effect = carried.find((id): id is ThemeEffectId => id !== 'Enchanted');
  const mult = multForTheme(roomCode, theme, bankRound);
  const bannedLettersMap = GameConfig.themes.bannedLetters;
  const count = bannedLettersMap[mult];
  if (count === undefined || count === 0) return { effect, banned: NoLetters };
  const random = randomFor(`${roomCode}:banned:${bankRound}:${theme}`);
  return { effect, banned: sampleUnique(LetterPairs, count, random) };
}
