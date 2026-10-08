import { CenterStage } from '../CenterStage';
import styles from './PausedRoom.module.css';

export interface PausedRoomProps {
  /** What the room is being told, in the count-in's own hand: a word rather than a figure,
   * passed in rather than read here, since a design layer does not know what a room says. */
  label: string;
}

/** The room held still, told the same way to everybody in it: the shade goes over the whole
 * window rather than one panel of it, since what is stopped is the game and not one screen of
 * it. It takes no pointer, because a held room has nothing to press. */
export function PausedRoom({ label }: PausedRoomProps) {
  return (
    <div class={styles.Root}>
      <div class={styles.Veil} />
      <CenterStage>{label}</CenterStage>
    </div>
  );
}
