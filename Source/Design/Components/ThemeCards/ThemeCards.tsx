import { ThemeId, themeAccent } from '@/Core';
import { useEffect, useRef } from 'preact/hooks';
import type { RefObject } from 'preact';
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
  /** How many rounds have been played in each theme. A count per theme rather than one number
   * for the bank, because the bank is the same six themes every round and each drains on its
   * own. */
  spent?: ReadonlyMap<ThemeId, number>;
}

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

/** The themes a lobby is being offered, six cards in a bank, lying flat: the bank was once six
 * screens in a ring facing the middle of the viewport, and the ring was measured on every
 * resize. The theme it settled on has its wash written onto the page. */
export function ThemeCards({
  themes,
  names,
  onPick,
  roundsPerTheme,
  spent,
  picked,
}: ThemeCardsProps) {
  const bank = useRef<HTMLDivElement>(null);
  const settled = picked !== undefined;
  // A bank with nothing to ask for is being read rather than played, so its cards are held back
  // rather than dead: the room is watching whose turn it is come round. Once the room has
  // answered there is nothing to hold back from, and dimming the room's own decision to whoever
  // did not press it would be drawing it as somebody's private choice. */
  const waiting = !settled && onPick === undefined;

  useWash(picked, bank);

  return (
    <div
      class={settled ? `${styles.Root} ${styles.Settled}` : styles.Root}
      ref={bank}
      role="group"
    >
      {themes.map((theme, index) => (
        <div class={slotClass(theme, picked)} key={theme}>
          <ThemeCard
            theme={theme}
            name={names[theme]}
            index={index + 1}
            rounds={roundsPerTheme}
            spent={spent?.get(theme) ?? 0}
            chosen={theme === picked}
            locked={settled}
            waiting={waiting}
            onPick={onPick}
          />
        </div>
      ))}
    </div>
  );
}
