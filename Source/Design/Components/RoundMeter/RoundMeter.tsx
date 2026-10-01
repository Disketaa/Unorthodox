import styles from './RoundMeter.module.css';

export interface RoundMeterProps {
  /** How many rounds this theme is played for. */
  rounds: number;
  /**
   * Which tick has not been played yet, counted from one.
   *
   * A tick rather than the round the room is on, because the row is drawn the other way
   * round: every tick is the theme's own colour and it is the one still to come that is
   * greyed. The theme has been chosen, so the rounds ahead of it are what is left to play,
   * and one number saying which tick that is beats two facts about progress that have to
   * agree with each other.
   */
  pending?: number;
}

/**
 * The theme's rounds as a row of ticks along the bottom of a card: all of them the theme's
 * own colour, with the one still to play greyed out.
 *
 * A card per theme rather than a bar for the game: each of the six cards shows its own
 * progress, so the room is holding six themes at once and each of them has somewhere to get
 * to. The marks are ticks rather than a filled bar because a theme is a countable list of
 * rounds and ten of them fit; a fill would say how far along it is and not how many are
 * left, which is the half of the answer a player cannot work out for themselves.
 *
 * Everything coloured and one tick quiet, rather than progress filling up, because nothing
 * is played yet and the row is saying what the theme will be asked for rather than what has
 * happened. When the greyed tick is played it takes the colour of the nine beside it and the
 * next one greys, which is the whole of what a round advancing looks like on a card.
 *
 * The quiet tick is the last one by default, which is where a row of ten reads from. A row
 * that fills left to right has its eye drawn to the tick at the start; a row that empties
 * from the start has its eye drawn to the end, which is the far end of the theme — where the
 * row is counting to.
 *
 * The whole row is `aria-hidden` and the card names the round in words instead: ten pipes
 * read out as a burst of punctuation, and the tick that matters is the grey one, which a
 * screen reader cannot see.
 */
export function RoundMeter({ rounds, pending = rounds }: RoundMeterProps) {
  return (
    <div class={styles.Root} aria-hidden="true">
      {Array.from({ length: rounds }, (_, tick) => tick + 1).map((tick) => (
        <span
          class={`${styles.Mark} ${tick === pending ? styles.Pending : ''}`}
          key={tick}
        />
      ))}
    </div>
  );
}
