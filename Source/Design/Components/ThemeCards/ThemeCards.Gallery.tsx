import { ThemeId, createRandom, dealThemes } from '@/Core';
import { Stack } from '@/Design/Primitives';
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
  const first = themes[0];
  return (
    <Stack gap="Lg">
      <ThemeCards themes={themes} names={names} roundsPerTheme={10} spent={4} />
      {first !== undefined && (
        <>
          {/* The room has answered: one card open across the bank and the rest gone. */}
          <ThemeCards
            themes={themes}
            names={names}
            roundsPerTheme={10}
            spent={4}
            picked={first}
          />
          {/* A bank with nothing to press, which is every phase but Choosing and every player
           * whose turn it is not. `onPick` left off rather than a flag passed, since that is what
           * a non-turning player's props actually hold. */}
          <ThemeCards themes={themes} names={names} roundsPerTheme={10} spent={4} />
        </>
      )}
    </Stack>
  );
}
