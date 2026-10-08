import { ThemeId, createRandom, dealThemes } from '@/Core';
import { Stack } from '@/Design/Primitives';
import { ThemeCards, type ThemeCardsProps } from './ThemeCards';

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

/** Four rounds played in the theme the room just came out of, and a full bar everywhere else:
 * the bank is the same six themes every round, so this is what the second Choosing looks like. */
function partlySpent(first: ThemeId | undefined): Map<ThemeId, number> {
  return new Map(first === undefined ? [] : [[first, 4]]);
}

/** The same, with the next theme in the bank run out: a card held back and left there, since
 * nothing is ever going to come to it. */
function withOneFinished(themes: readonly ThemeId[], first: ThemeId | undefined) {
  const spent = partlySpent(first);
  const second = themes[1] ?? first;
  if (second !== undefined) spent.set(second, 10);
  return spent;
}

/** The same bank again, with only what this case is showing left to differ. Four near-identical
 * banks is four blocks of the same props, and one of them being edited without the other is how
 * a gallery stops showing the component it is a gallery of. */
function Bank(
  rest: Partial<ThemeCardsProps> & Pick<ThemeCardsProps, 'themes' | 'spent'>
) {
  return <ThemeCards names={names} roundsPerTheme={10} {...rest} />;
}

export function ThemeCardsGallery() {
  const themes: readonly ThemeId[] = dealThemes(createRandom(7), 6);
  const first = themes[0];
  const spent = partlySpent(first);
  return (
    <Stack gap="Lg">
      {/* The bank on offer, to the player whose turn it is. */}
      <Bank themes={themes} spent={spent} onPick={() => {}} />
      {first !== undefined && (
        <>
          {/* The same bank on somebody else's turn: held back, still under the pointer. */}
          <Bank themes={themes} spent={spent} />
          {/* And a bank with a theme in it that the room has finished. */}
          <Bank themes={themes} spent={withOneFinished(themes, first)} />
          {/* And a bank the room is answering itself, with its roll on one card. */}
          <Bank themes={themes} spent={spent} picking swept={themes[2]} />
          {/* And the room's answer, at full strength on every screen: whoever pressed it and
           * whoever did not, the expanded card is drawn the same either way. */}
          <Bank themes={themes} spent={spent} picked={first} />
        </>
      )}
    </Stack>
  );
}
