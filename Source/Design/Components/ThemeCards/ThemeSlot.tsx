import { ThemeId, themeName, themeQuestions } from '@/Core';
import { Pop } from '@/Design/Primitives';
import { ThemeCard } from '../ThemeCard';
import type { ThemeCardsProps } from './ThemeCards';
import styles from './ThemeCards.module.css';

/** Raised over `--Pop-Stagger`, which is sized for a row of characters standing close: six large
 * cards at it arrive as one movement rather than a wave. */
export const SlotStagger = '40ms';

export function slotClass(theme: ThemeId, picked: ThemeId | undefined): string {
  if (theme === picked) return `${styles.Slot} ${styles.Chosen}`;
  if (picked !== undefined) return `${styles.Slot} ${styles.Gone}`;
  return styles.Slot;
}

/** What one slot is told: the bank's own props, with the two that are the bank's decision rather
 * than a card's added. */
export type SlotProps = Pick<
  ThemeCardsProps,
  'roundsPerTheme' | 'spent' | 'modifiers' | 'mults' | 'effectLabels' | 'picked' | 'onPick'
> & {
  theme: ThemeId;
  index: number;
  swept: ThemeId | undefined;
  waiting: boolean;
  /** Whether the winning show has already taken this card away, which leaves its cell behind. */
  gone: boolean;
  /** Whether the winning show is taking this card away right now. */
  leaving: boolean;
};

/** The card inside a slot: the same arrival the characters have, keyed on the theme so a bank
 * that is dealt a new set pops the way a roster that turns up new players does, and the card's
 * place in the bank as its place in the row, so six cards ripple rather than fire in unison. */
function SlotCard({
  theme,
  index,
  roundsPerTheme,
  spent,
  modifiers,
  mults,
  effectLabels,
  picked,
  swept,
  onPick,
  waiting,
  leaving,
}: Omit<SlotProps, 'gone'>) {
  const chosen = theme === picked;
  // The round being played is counted against the theme already but has not been played, and
  // showing it spent drains the chosen card on the very press that expands it — a theme on its
  // last round comes up greyed while still being answered. It catches up on the next bank.
  const played = Math.max(0, (spent?.get(theme) ?? 0) - (chosen ? 1 : 0));
  return (
    <Pop trigger={theme} index={index} stagger={SlotStagger}>
      <ThemeCard
        theme={theme}
        name={themeName(theme)}
        index={index + 1}
        rounds={playableRounds(theme, roundsPerTheme)}
        spent={played}
        modifiers={modifiers?.get(theme)}
        mult={mults?.get(theme)}
        effectLabel={effectLabels?.get(theme)}
        chosen={chosen}
        swept={theme === swept}
        locked={picked !== undefined}
        waiting={waiting}
        leaving={leaving}
        onPick={onPick}
      />
    </Pop>
  );
}

/** One card's slot in the bank: its cell in the grid, the room's roll arriving on it, and the
 * card. A function rather than more markup in the map, since both the slot's own class and the
 * card's dozen props belong to a card rather than to the bank. */
export function ThemeSlot(props: SlotProps) {
  const { theme, gone, picked } = props;
  // A card the winning show has taken away keeps its cell and gives up its card, so the bank does
  // not close up under the room's eyes.
  if (gone) {
    return <div class={slotClass(theme, picked)} key={theme} />;
  }
  return (
    <div class={slotClass(theme, picked)} key={theme}>
      <SlotCard {...props} />
    </div>
  );
}

/** How many rounds a theme can actually be played for: the fewer of what the pace allows and
 * what the theme has questions for, since a round is dealt one question and never repeats one. */
export function playableRounds(theme: ThemeId, roundsPerTheme: number): number {
  const asked = themeQuestions(theme)?.length;
  return asked === undefined ? roundsPerTheme : Math.min(roundsPerTheme, asked);
}
