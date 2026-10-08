/** What a theme asks, as its own deck per room. The questions are Content and how many a theme
 * is played for is a rule, so the deal belongs to neither layer alone and goes here with both. */
import { ThemeBanks, ThemeId, randomFor, sampleUnique } from '@/Core';
import { GameConfig } from './GameConfig';

/** The questions one room plays in one theme: dealt at random from the theme's file, never
 * repeated within it, and seeded from the room code so every tab deals the same deck with
 * nothing sent. */
export function deckFor(roomCode: string, theme: ThemeId): string[] {
  return sampleUnique(
    ThemeBanks.get(theme) ?? [],
    GameConfig.themes.roundsPerTheme,
    randomFor(`${roomCode}:${theme}`)
  );
}

/** The question a round in this theme asks, by position off that room's deck. `roundsSpent`
 * counts the round being asked as one of them, so the first round in a theme takes the first
 * question. */
export function questionFor(roomCode: string, theme: ThemeId, roundsSpent: number): string {
  const deck = deckFor(roomCode, theme);
  const held = deck[(((roundsSpent - 1) % deck.length) + deck.length) % deck.length];
  return held ?? '';
}
