/** What one round's bank of theme cards carries, rolled rather than sent. An arrangement every
 * player has to see identically cannot come from one player's roll, and the deal of themes and
 * the question deck above already settle that by seeding from the room's own four letters. */
import { ThemeId, ThemeModifierId, randomFor, sampleUnique } from '@/Core';
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
    enchanted.set(theme, ['Enchanted']);
  }
  return enchanted;
}

/** Multiplier rolled per theme from room/round seed. */
export function multForTheme(roomCode: string, theme: ThemeId, round: number): number {
  const random = randomFor(`${roomCode}:mult:${round}:${theme}`);
  return GameConfig.themes.mults[Math.floor(random() * GameConfig.themes.mults.length)];
}
