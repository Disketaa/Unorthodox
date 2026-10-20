import { Pop } from '@/Design/Primitives';
import { ScoreCount } from '../ScoreCount';
import { scoreCountMs } from '../ScoreTiming';
import { FittedAnswer } from './FittedAnswer';
import styles from './AnswerCard.module.css';

/** What one card paid, in the steps the scorer takes it in. The same shape the wire carries, so
 * nothing about a figure on a card is worked out here. */
export interface CardScore {
  base: number;
  mult: number;
  likes: number;
  total: number;
}

/** Which line a figure belongs to, carried into the key every figure is mounted on: a figure
 * sharing its key with the one before it would be thought the same element and would not count
 * up from its own previous figure. */
type StepName = 'base' | 'mult' | 'likes';

/** One line of the count: the figure the card is on once this line has landed, and what the line
 * was. A step with nothing to add in it is left out rather than shown as a zero. */
interface Step {
  /** The running total once this line has landed. */
  to: number;
  /** The figure the previous line left on the card, which is what this one counts up from. */
  from: number;
  name: StepName;
  /** How long this figure takes to arrive. */
  durationMs: number;
  /** How far into the card's own count this line begins. */
  atMs: number;
}

/** One of the three things a card's count pays, before the rows with nothing in them are
 * dropped. */
interface Row {
  value: number;
  name: StepName;
}

/** The lines of a card's count, each with the moment it begins and how long its figure takes.
 * The card's count budget is divided between the lines and they are laid end to end across
 * exactly that budget, so a card finishes counting inside its own turn by construction. */
function steps(score: CardScore): Step[] {
  const every: Row[] = [
    { value: score.base, name: 'base' },
    { value: score.mult, name: 'mult' },
    { value: score.likes, name: 'likes' },
  ];
  const rows = every.filter((row) => row.value !== 0);
  // The lines do not necessarily add up to the total on their own: the scorer rounds what it
  // pays and the figures are built from the rounded parts. The gap belongs to the first line,
  // so the running figures end on the total the host settled rather than on one of our own.
  const counted = rows.reduce((sum, row) => sum + row.value, 0);
  let running = score.total - counted;
  // The card's count budget, which is not its whole beat: the beat also carries the addition
  // and the total the bar shows after, so a count that overran this is a card still counting
  // while the room is being told about the next one.
  const budget = scoreCountMs();
  // Every line is given the same share of it: nothing stands in the figure's place before it
  // now, so a line is watched for as long as the one beside it.
  const share = Math.max(1, Math.round(budget / Math.max(1, rows.length)));
  let atMs = 0;
  return rows.map((row) => {
    const step: Step = {
      from: running,
      to: running + row.value,
      name: row.name,
      durationMs: share,
      atMs,
    };
    running += row.value;
    atMs += share;
    return step;
  });
}

/** Which line the room is watching, counted off the card's own start. One figure at a time: a
 * card carrying three figures at once is a receipt, and the room is meant to watch the number
 * move rather than to read one. */
function currentStep(lines: readonly Step[], elapsedMs: number): Step {
  let watching = lines[0];
  for (const line of lines) {
    if (elapsedMs >= line.atMs) watching = line;
  }
  return watching;
}

/** A card the round scored nothing: drawn as the answer's own writing rather than as a figure of
 * the score's, so nothing scored looks like what the room struck out and not like a charge.
 * What the room hears about it is the slot's business — a note in here sounded per rebuild. */
function NothingPaid({ run }: { run: number }) {
  return (
    <>
      <span class={styles.Panel} aria-hidden="true" />
      <span class={styles.Noise} aria-hidden="true" />
      {/* Keyed on the run, so zero arrives the way every other figure does — coming up rather
       * than being there — and again when the host puts the phase back to the start. */}
      <Pop trigger={`${run}:zero`}>
        <FittedAnswer text="0" />
      </Pop>
    </>
  );
}

/** A card being paid: one figure, counting up to what the card is worth at this line of its
 * count. The next line replaces it rather than joining it, and the last one is what stays — the
 * count ending on the card's final figure is the whole point of the phase. */
function PaidFigure({
  shown,
  paused,
  run,
  onBeat,
}: {
  shown: Step;
  paused: boolean;
  run: number;
  onBeat?: () => void;
}) {
  return (
    <>
      <span class={styles.Panel} aria-hidden="true" />
      <span class={styles.Noise} aria-hidden="true" />
      <span class={styles.ScoreRoom}>
        {/* Keyed on the line itself, so each figure is a new element that counts from its own
         * previous figure with its own pop rather than carrying the last line's count-in. */}
        <span class={styles.Step} key={`${run}:${shown.name}`}>
          <ScoreCount
            from={shown.from}
            to={shown.to}
            onBeat={onBeat}
            durationMs={shown.durationMs}
            paused={paused}
            run={run}
          />
        </span>
      </span>
    </>
  );
}

/** The card being paid: it stands in the answer's place rather than over it — a card is being
 * read or it is being paid, never both — and the panel and grain behind it are the answer's
 * own, so the card does not change shape between the two. */
export function Score({
  score,
  paused = false,
  run = 0,
  elapsedMs,
  onBeat,
}: {
  score: CardScore;
  paused?: boolean;
  run?: number;
  /** How far into this card's own count the room is, off the phase clock. Left out once the
   * count has been through the card, which is how a finished count says so. */
  elapsedMs?: number;
  /** Handed to the count when it swaps the figure for a mark and back, so the card is popped on
   * the change rather than only the figure inside it being redrawn. */
  onBeat?: () => void;
}) {
  if (score.total === 0) {
    return <NothingPaid run={run} />;
  }
  const lines = steps(score);
  // Left out once the count has been through the card, which is how a finished count says so:
  // the last line is what the card paid and the room is left looking at it.
  const shown: Step =
    elapsedMs === undefined ? lines[lines.length - 1] : currentStep(lines, elapsedMs);
  return <PaidFigure shown={shown} paused={paused} run={run} onBeat={onBeat} />;
}
