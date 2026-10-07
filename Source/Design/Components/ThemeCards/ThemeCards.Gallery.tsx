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
      {/* The bank on offer, to the player whose turn it is. */}
      <ThemeCards
        themes={themes}
        names={names}
        roundsPerTheme={10}
        spent={4}
        onPick={() => {}}
      />
      {first !== undefined && (
        <>
          {/* The same bank on somebody else's turn: held back, still under the pointer. */}
          <ThemeCards themes={themes} names={names} roundsPerTheme={10} spent={4} />
          {/* And the room's answer, at full strength on every screen: whoever pressed it and
           * whoever did not, the expanded card is drawn the same either way. */}
          <ThemeCards
            themes={themes}
            names={names}
            roundsPerTheme={10}
            spent={4}
            picked={first}
          />
        </>
      )}
    </Stack>
  );
}
