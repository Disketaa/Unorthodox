import { ThemeId, themeAccent } from '@/Core';
import { useEffect, useRef, useState } from 'preact/hooks';
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
  /** How many of each theme's rounds have been played. Left out, it is none on every card: a
   * bank of full bars, themes nobody has chosen yet. Every card carries the same count, which
   * is why it is here rather than on one card. */
  spent?: number;
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
 * resize. The pick is local, and the theme it settled on has its wash written onto the page. */
export function ThemeCards({ themes, names, onPick, roundsPerTheme, spent }: ThemeCardsProps) {
  const [picked, setPicked] = useState<ThemeId | undefined>(undefined);
  const bank = useRef<HTMLDivElement>(null);
  const settled = picked !== undefined;
  // A bank with nothing to ask for is a bank being read rather than played, so its cards are held
  // back rather than dead: the room is watching whose turn it is come round.
  const waiting = onPick === undefined;

  useWash(picked, bank);

  const pick = (next: ThemeId) => {
    setPicked(next);
    onPick?.(next);
  };

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
            spent={spent}
            chosen={theme === picked}
            locked={settled}
            waiting={waiting}
            onPick={pick}
          />
        </div>
      ))}
    </div>
  );
}
