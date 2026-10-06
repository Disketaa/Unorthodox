import { useSwayMotion } from '@/Design/Primitives';
import { Character } from '../Character';
import type { PlayerBarEntry } from './PlayerBar';
import styles from './PlayerBar.module.css';

export interface PlayerBarSlotProps {
  entry: PlayerBarEntry;
  /** Its place in the row, so a row of arrivals ripples rather than popping at once. */
  index: number;
  isSelf: boolean;
  /** Whether this is the room's host. A fact about the room rather than about whoever is looking
   * at it, so the crown is drawn in the room's yellow and every player in the bar is shown the
   * same one. */
  isHost?: boolean;
}

/** One player in the bar: the character alone, inside a hexagon. No name and no score, because
 * twelve of them in one row have nothing left to give, and a face is what a player recognises
 * across a room where a name is a thing they read once. */
export function PlayerBarSlot({ entry, index, isSelf, isHost = false }: PlayerBarSlotProps) {
  const offline = entry.isOnline === false;
  const crownRef = useSwayMotion();
  const classes = [styles.Seat, isSelf ? styles.Self : '', offline ? styles.Offline : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div class={classes}>
      <span class={styles.Slot}>
        <span class={styles.Face}>
          <Character character={entry.character} color={entry.color} size="Fill" index={index} />
        </span>
      </span>
      {isHost && (
        <span class={styles.Crown} ref={crownRef} aria-hidden="true">
          <span class={styles.CrownIcon} />
        </span>
      )}
    </div>
  );
}
