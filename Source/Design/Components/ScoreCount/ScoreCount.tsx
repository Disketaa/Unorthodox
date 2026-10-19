import { Pop } from '@/Design/Primitives';
import { useCountRun } from './UseCountRun';
import type { CountPhase } from './CountAt';
import styles from './ScoreCount.module.css';

export interface ScoreCountProps {
  /** The figure the count starts from. */
  from: number;
  /** The figure the count stops at. */
  to: number;
  /** What this step added to the running total, shown on its own before the figure takes it.
   * Left out on the first step of a card, which has nothing to add to. */
  added?: number;
  /** What kind of thing the step is adding, which is the mark shown in the figure's place: the
   * room reads what is coming and then watches it arrive rather than seeing both at once. */
  addedMark?: 'Mult' | 'Likes';
  /** Called on every handover between the figure, the mark and the count, so the card pops on
   * the change rather than only the figure inside it being redrawn. */
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

/** One line of a card being paid: the running total counting up, standing in its own place for a
 * mark of what this step is adding before it takes it on. */
export function ScoreCount({
  from,
  to,
  added,
  addedMark,
  onBeat,
  durationMs = 900,
  paused = false,
  run = 0,
}: ScoreCountProps) {
  const { value, phase, step } = useCountRun({
    from,
    to,
    added,
    addedMark,
    onBeat,
    durationMs,
    paused,
    run,
  });
  return (
    <div class={styles.Root}>
      <ScoreFigure
        phase={phase}
        value={value}
        step={step}
        added={added}
        addedMark={addedMark}
        run={run}
      />
    </div>
  );
}

/** What is standing in the figure's place: the mark while the room reads what is coming, and the
 * figure counting the rest of the way. Both written as the figure is, so the card keeps its
 * shape through the swap and the eye stays where the number was. */
function ScoreFigure({
  phase,
  value,
  step,
  added,
  addedMark,
  run,
}: {
  phase: CountPhase;
  value: number;
  step: number;
  added?: number;
  addedMark?: 'Mult' | 'Likes';
  run: number;
}) {
  if (phase === 'mark') {
    return (
      <span class={styles.Figure}>
        <span class={styles.Added}>
          {added}
          <span class={`${styles.MarkIcon} ${styles[`Mark${addedMark}`]}`} />
        </span>
      </span>
    );
  }
  return (
    <span class={styles.Figure}>
      {/* Keyed on the run as well as the step, so beginning the count again is a new element
       * even where the step it left off at is the one it returns to. */}
      <Pop trigger={`${run}:${step}`}>
        <span class={styles.Value}>{value}</span>
      </Pop>
    </span>
  );
}
