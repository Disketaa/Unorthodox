import { ThemeId, themeAccent } from '@/Core';
import { useEffect, useRef } from 'preact/hooks';
import type { RefObject } from 'preact';
import { Pop } from '@/Design/Primitives';
import { ThemeCard } from '../ThemeCard';
import styles from './ThemeCards.module.css';

export interface ThemeCardsProps {
  /** The themes this lobby was dealt, in the order they are shown. */
  themes: readonly ThemeId[];
  /** Names for the themes, by the same key as `ThemeId`. */
  names: Readonly<Record<ThemeId, string>>;
  /** Asking for a theme. Left out where nothing is being chosen, which is every phase but
   * Choosing, and on the cards of a player who is not the one whose turn it is. */
  onPick?: (theme: ThemeId) => void;
  /** How many rounds each theme is played for, from the game's own rules. */
  roundsPerTheme: number;
  /** The theme the room settled on, which expands to fill the bank. The room's answer, read off
   * the state every client is sent rather than kept per screen, so a press opens the same card
   * in every browser in the room at the same moment. */
  picked?: ThemeId;
  /** Whether the room is answering its own bank, and which card it is looking at. The roll is on
   * the room rather than on any screen, so this is drawn from what every client was sent. */
  picking?: boolean;
  /** The card the room's roll is on, drawn as though the pointer were on it. Undefined outside a
   * roll, and held on the card the roll landed on through its last stretch. */
  swept?: ThemeId;
  /** How many rounds have been played in each theme. A count per theme rather than one number
   * for the bank, because the bank is the same six themes every round and each drains on its
   * own. */
  spent?: ReadonlyMap<ThemeId, number>;
}

/** Raised over `--Pop-Stagger`, which is sized for a row of characters standing close: six large
 * cards at it arrive as one movement rather than a wave. */
const SlotStagger = '40ms';

function slotClass(theme: ThemeId, picked: ThemeId | undefined): string {
  if (theme === picked) return `${styles.Slot} ${styles.Chosen}`;
  if (picked !== undefined) return `${styles.Slot} ${styles.Gone}`;
  return styles.Slot;
}

/** The wash of the theme the room settled on, written onto the page behind everything and onto
 * the bank itself. An effect rather than a render-time write, since it is the page rather than
 * this component that changes, and it is undone on the way out. */
function useWash(picked: ThemeId | undefined, bank: RefObject<HTMLDivElement>): void {
  useEffect(() => {
    if (picked === undefined) {
      return;
    }
    const wash = themeAccent(picked).wash;
    document.body.style.setProperty('--Color-Page-Fill', wash);
    bank.current?.style.setProperty('--ThemeCards-Chosen', wash);
    return () => document.body.style.removeProperty('--Color-Page-Fill');
  }, [picked, bank]);
}

/** What one slot is told: the bank's own props, with the two that are the bank's decision rather
 * than a card's added. */
type SlotProps = Pick<ThemeCardsProps, 'names' | 'roundsPerTheme' | 'spent' | 'picked' | 'onPick'> & {
  theme: ThemeId;
  index: number;
  swept: ThemeId | undefined;
  waiting: boolean;
};

/** One card's slot in the bank: its cell in the grid, the room's roll arriving on it, and the
 * card. A function rather than more markup in the map, since both the slot's own class and the
 * card's dozen props belong to a card rather than to the bank. */
function ThemeSlot({
  theme,
  index,
  names,
  roundsPerTheme,
  spent,
  picked,
  swept,
  onPick,
  waiting,
}: SlotProps) {
  return (
    <div class={slotClass(theme, picked)} key={theme}>
      {/* The same arrival the characters have, keyed on the theme so a bank that is dealt a new
       * set pops the way a roster that turns up new players does, and the card's place in the
       * bank as its place in the row, so six cards ripple rather than fire in unison. */}
      <Pop trigger={theme} index={index} stagger={SlotStagger}>
        <ThemeCard
          theme={theme}
          name={names[theme]}
          index={index + 1}
          rounds={roundsPerTheme}
          spent={spent?.get(theme) ?? 0}
          chosen={theme === picked}
          swept={theme === swept}
          locked={picked !== undefined}
          waiting={waiting}
          onPick={onPick}
        />
      </Pop>
    </div>
  );
}

/** The themes a lobby is being offered, six cards in a bank, lying flat: the bank was once six *
 * screens in a ring facing the middle of the viewport, and the ring was measured on every
 * resize. The theme it settled on has its wash written onto the page. */
export function ThemeCards({
  themes,
  names,
  onPick,
  roundsPerTheme,
  spent,
  picked,
  picking = false,
  swept,
}: ThemeCardsProps) {
  const bank = useRef<HTMLDivElement>(null);
  const settled = picked !== undefined;
  // A bank with nothing to ask for is being read rather than played, so its cards are held
  // back rather than dead, and a bank the room is answering itself is being read too.
  const waiting = !settled && (picking || onPick === undefined);

  useWash(picked, bank);

  return (
    <div
      class={settled ? `${styles.Root} ${styles.Settled}` : styles.Root}
      ref={bank}
      role="group"
    >
      {themes.map((theme, index) => (
        <ThemeSlot
          theme={theme}
          index={index}
          names={names}
          roundsPerTheme={roundsPerTheme}
          spent={spent}
          picked={picked}
          swept={swept}
          onPick={onPick}
          waiting={waiting}
        />
      ))}
    </div>
  );
}
