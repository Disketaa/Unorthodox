import styles from './RoundMeter.module.css';

export interface RoundMeterProps {
  /** How many rounds this theme is played for. */
  rounds: number;
  /** How many of those rounds have been played, counted from the right. A count of what has
   * gone, not an index of what is next: the ticks come off the right end as they are spent.
   * Left out it is nothing, which is a full bar, a theme nobody has chosen yet. */
  spent?: number;
}

/** The theme's rounds as a health bar along the bottom of a card. A card per theme: the room
 * holds six at once and each has somewhere to get to. Ticks rather than a fill, since it
 * empties in round-sized steps and ten ticks say how many are left. */
export function RoundMeter({ rounds, spent = 0 }: RoundMeterProps) {
  const firstSpent = rounds - spent;
  return (
    <div class={styles.Root} aria-hidden="true">
      {Array.from({ length: rounds }, (_, tick) => tick + 1).map((tick) => (
        <span
          class={`${styles.Mark} ${tick > firstSpent ? styles.Spent : ''}`}
          key={tick}
        />
      ))}
    </div>
  );
}