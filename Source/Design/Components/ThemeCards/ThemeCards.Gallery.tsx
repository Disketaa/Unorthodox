import { ThemeId, createRandom, dealThemes } from '@/Core';
import { ThemeCards } from './ThemeCards';

/** The bank as the gallery runs it, with the ids standing in for the names. Written out rather
 * than derived from `ThemeIds`, since deriving it would need a cast whose keys the compiler
 * cannot check. Written out, the compiler asks for the new key. */
const names: Readonly<Record<ThemeId, string>> = {
  VideoGames: 'VideoGames',
  Nature: 'Nature',
  Internet: 'Internet',
  Food: 'Food',
  Music: 'Music',
  Movies: 'Movies',
  Work: 'Work',
  Travel: 'Travel',
  Random: 'Random',
};

export function ThemeCardsGallery() {
  const themes: readonly ThemeId[] = dealThemes(createRandom(7), 6);
  return <ThemeCards themes={themes} names={names} roundsPerTheme={10} spent={4} />;
}
