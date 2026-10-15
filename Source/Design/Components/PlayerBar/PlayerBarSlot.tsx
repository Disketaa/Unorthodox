import { Character } from '../Character';
import characterStyles from '../Character/Character.module.css';
import { useGlintVariant } from '../Glint';
import type { PlayerBarEntry } from './PlayerBar';
import styles from './PlayerBar.module.css';

export interface PlayerBarSlotProps {
  entry: PlayerBarEntry;
  /** Its place in the row, so a row of arrivals ripples rather than popping at once. */
  index: number;
  isSelf: boolean;
}

/** The seat's classes: its own tint, and the marks for what the room is waiting on it for. */
function seatClasses(entry: PlayerBarEntry, isSelf: boolean, atWork: boolean): string {
  const offline = entry.isOnline === false;
  // The round gave this player nothing, so their hexagon is the shattered one. A seat the round
  // scored nothing is still a seat in the room, which is why it is broken rather than taken away.
  const scoredNothing = entry.scoredNothing === true;
  // The seat wears the player's own tint, the same class the character inside it wears. The seat
  // cannot read that off the character, since a custom property set on it stays down there.
  return [
    styles.Seat,
    characterStyles[entry.color],
    isSelf ? styles.Self : '',
    atWork ? styles.Waiting : '',
    offline ? styles.Offline : '',
    scoredNothing ? styles.Destroyed : '',
    entry.glinted ? styles.Glinted : '',
  ]
    .filter(Boolean)
    .join(' ');
}

/** One player in the bar: their name over a hexagon, and their score over it instead while the
 * pointer is on the seat. The name is what a player looks for in a room they have just joined,
 * where a face alone asks them to remember who they picked. */
export function PlayerBarSlot({ entry, index, isSelf }: PlayerBarSlotProps) {
  // At work, whichever way the room is waiting on them: holding the turn to pick a theme, or
  // writing an answer nobody has read yet. One mark for both, so a seat at work looks the same
  // whoever it is that is doing the waiting.
  const atWork = entry.isTurning === true || entry.isWorking === true;
  const variant = useGlintVariant();
  const glintClass = `${styles.Glint} ${styles[`Glint${variant}`]}`;

  return (
    <div class={seatClasses(entry, isSelf, atWork)}>
      <span class={styles.Slot}>
        <span class={styles.Face}>
          {atWork ? (
            <span class={styles.Turning} aria-hidden="true" />
          ) : (
            <Character
              character={entry.character}
              color={entry.color}
              size="Fill"
              pulse={entry.pulse}
              index={index}
            />
          )}
        </span>
        {entry.glinted && <span class={glintClass} aria-hidden="true" />}
      </span>
      <span class={styles.Label}>
        <span class={styles.Name}>{entry.name}</span>
        <span class={styles.Score}>{entry.score}</span>
      </span>
    </div>
  );
}
