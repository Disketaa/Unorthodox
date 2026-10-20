import { Pop } from '@/Design/Primitives';
import { useCountRun } from './UseCountRun';
import styles from './ScoreCount.module.css';

export interface ScoreCountProps {
  /** The figure the count starts from. */
  from: number;
  /** The figure the count stops at. */
  to: number;
  /** Called when the line opens, so the card is popped on the change rather than only the figure
   * inside it being redrawn. */
  onBeat?: () => void;
  /** How long the count takes, in milliseconds. */
  durationMs?: number;
  /** Whether the room is held: the count stands where it is and carries on from there rather
   * than from the beginning, since a number that rewound on every pause makes the pause the
   * loudest thing on a card. */
  paused?: boolean;
  /** What begins the count again: the start of the phase it belongs to. Carried into the pop's
   * own key, since a remount alone does not replay an animation the browser considers the same
   * one. */
  run?: number;
}

/** One line of a card being paid: the running total counting up. The figure is the whole of what
 * stands on the card while the line is counted, and the card keeps its shape through the count
 * because the eye stays where the number was. */
export function ScoreCount({
  from,
  to,
  onBeat,
  durationMs = 900,
  paused = false,
  run = 0,
}: ScoreCountProps) {
  const { value, step } = useCountRun({ from, to, onBeat, durationMs, paused, run });
  return (
    <div class={styles.Root}>
      <span class={styles.Figure}>
        {/* Keyed on the run as well as the step, so beginning the count again is a new element
         * even where the step it left off at is the one it returns to. */}
        <Pop trigger={`${run}:${step}`}>
          <span class={styles.Value}>{value}</span>
        </Pop>
      </span>
    </div>
  );
}
