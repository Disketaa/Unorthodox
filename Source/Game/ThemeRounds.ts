import type { ThemeId } from '@/Core';
import { GameConfig } from './GameConfig';

/** The room's counts with one more round against `theme`. Shared rather than written twice: a
 * commit that spent a round one way here and another there would leave a bank whose ticks do
 * not match what the room has played. */
export function roundsAfter(
  themeRounds: ReadonlyMap<ThemeId, number>,
  theme: ThemeId | undefined
): Map<ThemeId, number> {
  const counted = new Map(themeRounds);
  if (theme !== undefined) {
    counted.set(theme, (counted.get(theme) ?? 0) + 1);
  }
  return counted;
}

/** Whether the room has played every round the game is, so the next thing it sees is the end and
 * not another theme. The rounds counted are the ones started, so a room is over the moment its
 * last theme is picked rather than when it has finished answering it. */
export function gameIsOver(roundsPlayed: number): boolean {
  return roundsPlayed >= GameConfig.rounds.count;
}
