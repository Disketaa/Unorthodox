import { ThemeId } from '@/Core';
import { ThemeCard } from '../ThemeCard';
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
   * Left out it is none on every card, which is a bank of full bars — themes
   * nobody has chosen yet. Every card carries the same count, which is why it
   * is here on the bank rather than on one card: six themes are being played at
   * once and the room has spent the same number of rounds on all of them, and a
   * card that took its own would be showing a different amount of health from
   * the five beside it.
   */
  spent?: number;
}

/**
 * The themes a lobby is being offered, six cards in a bank.
 *
 * The cards lie flat and the row is a row: the bank was once turned to face the
 * middle of the viewport, six screens in a ring, and the ring turned out to be
 * a thing to be measured on every window resize rather than a thing a player
 * looks at. What is left is the arrangement that survives without the measuring
 * — six panels of one size, three across, wrapping rather than scrolling.
 *
 * The wrapper around each card is what the aspect ratio and the width are
 * declared on, so `ThemeCard` stays a closed component that knows nothing about
 * the size it is drawn at.
 */
export function ThemeCards({ themes, names, onPick, roundsPerTheme, spent }: ThemeCardsProps) {
  return (
    <div class={styles.Root} role="group">
      {themes.map((theme, index) => (
        <div class={styles.Slot} key={theme}>
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
