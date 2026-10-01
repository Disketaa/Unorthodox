import { Card } from '../Card';
import styles from './ThemeCard.module.css';

export interface ThemeCardProps {
  /** The theme's name in this player's language. */
  name: string;
}

/**
 * One theme, as a card with its name on it.
 *
 * A `Card` rather than a bespoke panel, so the six read as the same family as every
 * other container in the game, and the tilt is applied by the grid around them rather
 * than by each card knowing where it sits.
 */
export function ThemeCard({ name }: ThemeCardProps) {
  return (
    <Card variant="Elevated">
      <div class={styles.Name}>{name}</div>
    </Card>
  );
}
