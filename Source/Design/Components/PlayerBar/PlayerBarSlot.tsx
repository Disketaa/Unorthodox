import { Character } from '../Character';
import characterStyles from '../Character/Character.module.css';
import type { PlayerBarEntry } from './PlayerBar';
import styles from './PlayerBar.module.css';

export interface PlayerBarSlotProps {
  entry: PlayerBarEntry;
  /** Its place in the row, so a row of arrivals ripples rather than popping at once. */
  index: number;
  isSelf: boolean;
}

/** One player in the bar: their name over a hexagon, and their score over it instead while the
 * pointer is on the seat. The name is what a player looks for in a room they have just joined,
 * where a face alone asks them to remember who they picked. */
export function PlayerBarSlot({ entry, index, isSelf }: PlayerBarSlotProps) {
  const offline = entry.isOnline === false;
  const turning = entry.isTurning === true;
  // The seat wears the player's own tint, the same class the character inside it wears. The seat
  // cannot read that off the character, since a custom property set on it stays down there.
  const classes = [
    styles.Seat,
    characterStyles[entry.color],
    isSelf ? styles.Self : '',
    turning ? styles.Waiting : '',
    offline ? styles.Offline : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div class={classes}>
      <span class={styles.Slot}>
        <span class={styles.Face}>
          {turning ? (
            <span class={styles.Turning} aria-hidden="true" />
          ) : (
            <Character
              character={entry.character}
              color={entry.color}
              size="Fill"
              index={index}
            />
          )}
        </span>
      </span>
      <span class={styles.Label}>
        <span class={styles.Name}>{entry.name}</span>
        <span class={styles.Score}>{entry.score}</span>
      </span>
    </div>
  );
}
