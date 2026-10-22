import { ThemeId, ThemeModifierId, themeAccent } from '@/Core';
import { useEffect, useRef } from 'preact/hooks';
import type { RefObject } from 'preact';
import { ThemeSlot, type SlotProps } from './ThemeSlot';
import styles from './ThemeCards.module.css';

export interface ThemeCardsProps {
  /** The themes this lobby was dealt, in the order they are shown. */
  themes: readonly ThemeId[];
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
  /** What this round has put on the bank's cards, by theme. Absent wherever the round rolled no
   * modifiers at all, which is one of the answers the roll can give. */
  modifiers?: ReadonlyMap<ThemeId, readonly ThemeModifierId[]>;
  /** The multiplier on each card, by theme. Rolled from the room and the round rather than sent,
   * so a client cannot hand a card a number the host did not roll. */
  mults?: ReadonlyMap<ThemeId, number>;
  /** What each card's effect is called, by theme. Passed in rather than read here, since the
   * words are the content's and a card is drawn in Design. */
  effectLabels?: ReadonlyMap<ThemeId, string>;
  /** The cards the winning show has already taken away, which keep their cells so the bank does
   * not close up under the room's eyes. */
  gone?: ReadonlySet<ThemeId>;
  /** The card the winning show is taking away at this moment: it shrinks and goes, the way an
   * answer card leaves the board when the count has been through it. */
  leaving?: ThemeId;
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

/** The bank's own box, which is the plain bank or the one the room has settled on: the chosen
 * card fills it and the wash behind it is that theme's own. */
function bankClass(settled: boolean): string {
  return settled ? `${styles.Root} ${styles.Settled}` : styles.Root;
}

/** The bank's slots, one per theme it was dealt. */
function BankSlots(props: {
  themes: readonly ThemeId[];
  swept: ThemeId | undefined;
  waiting: boolean;
  gone: ReadonlySet<ThemeId> | undefined;
  leaving: ThemeId | undefined;
  shared: Omit<SlotProps, 'theme' | 'index' | 'swept' | 'waiting' | 'gone' | 'leaving'>;
}) {
  return (
    <>
      {props.themes.map((theme, index) => (
        <ThemeSlot
          key={theme}
          theme={theme}
          index={index}
          swept={props.swept}
          waiting={props.waiting}
          gone={props.gone?.has(theme) === true}
          leaving={props.leaving === theme}
          {...props.shared}
        />
      ))}
    </>
  );
}

/** The themes a lobby is being offered, six cards in a bank, lying flat: the bank was once six *
 * screens in a ring facing the middle of the viewport, and the ring was measured on every
 * resize. The theme it settled on has its wash written onto the page. */
export function ThemeCards({
  themes,
  onPick,
  roundsPerTheme,
  spent,
  modifiers,
  mults,
  effectLabels,
  picked,
  picking = false,
  swept,
  gone,
  leaving,
}: ThemeCardsProps) {
  const bank = useRef<HTMLDivElement>(null);
  const settled = picked !== undefined;
  // A bank with nothing to ask for is being read rather than played, so its cards are held
  // back rather than dead, and a bank the room is answering itself is being read too.
  const waiting = !settled && (picking || onPick === undefined);
  // The bank's own figures, which every slot is told alike: one object rather than seven named
  // per card, so a slot added later cannot be handed the room's data in a different order.
  const shared = { roundsPerTheme, spent, modifiers, mults, effectLabels, picked, onPick };
  useWash(picked, bank);

  return (
    <div
      class={bankClass(settled)}
      style={{ '--ThemeCards-Count': themes.length }}
      ref={bank}
      role="group"
    >
      <BankSlots
        themes={themes}
        swept={swept}
        waiting={waiting}
        gone={gone}
        leaving={leaving}
        shared={shared}
      />
    </div>
  );
}
