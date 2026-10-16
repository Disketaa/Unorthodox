import type { ThemeRef } from '@/Core';

/** The room's counts with one more round against `theme`. Shared rather than written twice: a
 * commit that spent a round one way here and another there would leave a bank whose ticks do
 * not match what the room has played. */
export function roundsAfter(
  themeRounds: ReadonlyMap<ThemeRef, number>,
  theme: ThemeRef | undefined
): Map<ThemeRef, number> {
  const counted = new Map(themeRounds);
  if (theme !== undefined) {
    counted.set(theme, (counted.get(theme) ?? 0) + 1);
  }
  return counted;
}
