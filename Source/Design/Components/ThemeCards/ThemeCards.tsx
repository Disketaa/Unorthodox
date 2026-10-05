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
  /** How many of each theme's rounds have been played. Left out, it is none on every card: a
   * bank of full bars, themes nobody has chosen yet. Every card carries the same count, which
   * is why it is here rather than on one card. */
  spent?: number;
}

/** The themes a lobby is being offered, six cards in a bank. The cards lie flat and the row is a
 * row: the bank was once six screens in a ring facing the middle of the viewport, and the ring
 * was a thing to be measured on every resize. */
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
