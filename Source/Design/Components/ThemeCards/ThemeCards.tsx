import { createRef } from 'preact';
import { useRef } from 'preact/hooks';
import { ThemeId } from '@/Core';
import { ThemeCard } from '../ThemeCard';
import { useCardTurns } from './UseCardTurns';
import styles from './ThemeCards.module.css';

export interface ThemeCardsProps {
  /** The themes this lobby was dealt, in the order they are shown. */
  themes: readonly ThemeId[];
  /** Names for the themes, by the same key as `ThemeId`. */
  names: Readonly<Record<ThemeId, string>>;
  /** Asking for a theme. Every card is live for now; who may press is not settled. */
  onPick?: (theme: ThemeId) => void;
  /** How many rounds each theme is played for, from the game's own rules. */
  roundsPerTheme: number;
  /**
   * How many of each theme's rounds have been played.
   *
   * Left out it is none on every card, which is a bank of full bars — themes nobody has
   * chosen yet. Every card carries the same count, which is why it is here on the bank rather
   * than on one card: six themes are being played at once and the room has spent the same
   * number of rounds on all of them, and a card that took its own would be showing a
   * different amount of health from the five beside it.
   */
  spent?: number;
}

/**
 * The themes a lobby is being offered, six cards facing the player.
 *
 * The arrangement is the point: each card is turned to face the middle of the viewport,
 * so the bank closes in on the player rather than sitting flat as six panels in a grid.
 * The turn is measured per card and re-measured when the window changes, which is why
 * this holds the refs rather than the stylesheet deciding — how far a card is from the
 * middle of the screen is a fact about the window, and a different fact on every screen
 * size.
 *
 * The wrapper around each card is what carries that measurement. It is the flex item, it
 * is the node the turn is written to, and it is what the aspect ratio below is declared
 * on, so `ThemeCard` stays a closed component that knows nothing about where it sits or
 * which way it is turned.
 *
 * One set of refs for the row's lifetime rather than one per render: the hook writes to
 * them on every resize, and a fresh set each render would be a fresh set of nodes to write
 * to every time anything else on the screen moved.
 */
export function ThemeCards({ themes, names, onPick, roundsPerTheme, spent }: ThemeCardsProps) {
  const row = useRef<HTMLDivElement>(null);
  const cards = useRef<ReturnType<typeof createRef<HTMLDivElement>>[]>([]);
  if (cards.current.length !== themes.length) {
    cards.current = themes.map(() => createRef<HTMLDivElement>());
  }
  useCardTurns(row, cards.current);

  return (
    <div class={styles.Root} role="group" ref={row}>
      {themes.map((theme, index) => (
        <div class={styles.Slot} key={theme} ref={cards.current[index]}>
          <ThemeCard
            theme={theme}
            name={names[theme]}
            index={index + 1}
            rounds={roundsPerTheme}
            spent={spent}
            onPick={onPick}
          />
        </div>
      ))}
    </div>
  );
}
