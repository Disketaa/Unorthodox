import { Character } from '../Character';
import type { PlayerBarEntry } from './PlayerBar';
import styles from './PlayerBar.module.css';

export interface PlayerBarSlotProps {
  entry: PlayerBarEntry;
  /** Its place in the row, so a row of arrivals ripples rather than popping at once. */
  index: number;
  isSelf: boolean;
}

/**
 * One player in the bar: the character, the name, the score.
 *
 * The three stacked rather than laid across, because a slot is narrow and a name long
 * enough to need the width cannot share a line with a number.
 */
export function PlayerBarSlot({ entry, index, isSelf }: PlayerBarSlotProps) {
  const offline = entry.isOnline === false;
  const classes = [styles.Slot, isSelf ? styles.Self : '', offline ? styles.Offline : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div class={classes}>
      <Character character={entry.character} color={entry.color} size="Small" index={index} />
      <span class={styles.Name}>{entry.name}</span>
      <span class={styles.Score}>{entry.score}</span>
    </div>
  );
}