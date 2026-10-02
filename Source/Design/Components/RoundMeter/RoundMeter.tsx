import styles from './RoundMeter.module.css';

export interface RoundMeterProps {
  /** How many rounds this theme is played for. */
  rounds: number;
  /**
   * How many of those rounds have been played, counted from the right.
   *
   * A count of what has gone rather than an index of what is next, because the row is a bar
   * that empties rather than one that fills: the ticks come off the right end as they are
   * spent, so after one round the row is nine coloured and one grey at the right. One number
   * says that; a tick index would have to be recomputed at every round and would put the
   * greyed tick at the wrong end on the way.
   *
   * Left out it is nothing, which is a full bar — a theme nobody has chosen yet.
   */
  spent?: number;
}

/**
 * The theme's rounds as a health bar along the bottom of a card: all of it the theme's own
 * colour, emptied from the right as rounds are played.
 *
 * A card per theme rather than a bar for the game: each of the six cards shows its own
 * health, so the room is holding six themes at once and each of them has somewhere to get to.
 *
 * Ticks rather than one continuous fill, because the bar empties in round-sized steps and a
 * continuous fill would move by a twentieth of itself each round rather than by a whole
 * segment. Ten of them also say how many rounds are left in total, which a fill sized as a
 * percentage does not.
 *
 * Full at the start, and that is the point: a theme that has not been chosen yet has all of
 * its rounds, and choosing it spends the first one. Playing a round is what greys a tick, so
 * the greyed ticks on a card are exactly the rounds that theme has already been asked for.
 *
 * The whole row is `aria-hidden` and the card names the round in words instead: ten pipes read
 * out as a burst of punctuation, and the ticks that matter are the grey ones, which a screen
 * reader cannot see.
 */
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