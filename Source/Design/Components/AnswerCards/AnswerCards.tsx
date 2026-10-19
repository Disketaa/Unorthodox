import { useCallback, useRef, useState } from 'preact/hooks';
import { useViewportMeasure } from '@/Design/Primitives';
import { AnswerSlot } from './AnswerSlot';
import { columnsFor, fillersFor, type AnswerCardsColumns } from './AnswerCardsLayout';
import type { AnswerCardsEntry } from './AnswerCardsEntry';
import styles from './AnswerCards.module.css';

export type { AnswerCardsEntry } from './AnswerCardsEntry';

export interface AnswerCardsProps {
  answers: readonly AnswerCardsEntry[];
  /** Voting an answer out. Left out where the room is being shown the round rather than asked
   * about it, and the cards are then records rather than controls. */
  onReject?: (id: number) => void;
  /** Liking an answer. Left out on the player's own answer, which they may not like, and on any
   * screen where the round is being shown rather than played. */
  onLike?: (id: number) => void;
  /** What the mute says out loud, the same on every card, so it is named once for the board. */
  muteLabel?: string;
  /** How many of the answers have been turned over. The rest are not on the board yet, which is
   * the point of the round: a board that can already read is a board nobody watched being wrong
   * about. Left out the whole board is up, which is every use but the one it exists for. */
  revealed?: number;
  /** Which card the count is on right now, which is the one card still at full ink. One card
   * after another, off the phase's own clock. */
  payingIndex?: number;
  /** Whether the rest of the board is held down while one card is paid. On for as long as the
   * count is running and off once it has been through the board, since a dark left over a
   * finished count is a dark over every figure the room is trying to read. */
  spotlight?: boolean;
  /** Whether the board is inert — nothing on it answers the pointer. The count is one reason,
   * but so is a pause: a room held still has nothing to do with the cards, and a card that
   * lights up under the finger while the room is held says the game is still listening. */
  inert?: boolean;
  /** How far into its count the card being paid is, off the phase clock the host holds. One
   * figure for the whole board: only one card counts at a time, and the one it moves to starts
   * its own count from nothing. */
  payingElapsedMs?: number;
  /** Whether the room is held, so the counts on the cards stand where they are. */
  paused?: boolean;
  /** What begins the count again: the start of the phase it belongs to. */
  run?: number;
}

/** The answers themselves, one slot each, keyed on the phase's start as well as on the answer: a
 * room put back to the beginning of its phase rebuilds the board rather than leaving the cards
 * as they were at the end of the last run. Everything a card remembers starts over. */
function Slots(
  props: AnswerCardsProps & {
    upTo: number;
  }
) {
  return (
    <>
      {props.answers.map((answer, index) => (
        <AnswerSlot
          key={`${answer.id}:${props.run}`}
          answer={answer}
          index={index}
          open={index < props.upTo}
          onReject={props.onReject}
          onLike={props.onLike}
          muteLabel={props.muteLabel}
          payingIndex={props.payingIndex}
          lifted={props.spotlight === true && index === props.payingIndex}
          payingElapsedMs={props.payingElapsedMs}
          paused={props.paused}
          run={props.run}
        />
      ))}
    </>
  );
}

/** The grid itself, measured against the room it is given in both directions. Nine answers are
 * three by three and twelve are three by four: the count of columns is the count of answers
 * capped at three, and the rows are whatever is left over. */
function BoardGrid(
  props: AnswerCardsProps & {
    upTo: number;
  }
) {
  const board = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState<AnswerCardsColumns>(() =>
    columnsFor(props.answers.length, 0)
  );
  const measure = useCallback(() => {
    setColumns(columnsFor(props.answers.length, board.current?.clientWidth ?? 0));
  }, [props.answers.length]);
  useViewportMeasure(board, measure);
  return (
    <div
      class={`${styles.Root} ${styles[`Columns${columns}`]}${
        props.spotlight === true || props.inert === true ? ` ${styles.NotPressable}` : ''
      }`}
      ref={board}
      role="group"
    >
      {props.spotlight === true && <span class={styles.Veil} aria-hidden="true" />}
      <Slots {...props} />
      {/* The cells the last row is short by, so a part-filled row sits in the middle of the
       * board rather than against its left edge. */}
      {Array.from({ length: fillersFor(props.answers.length, columns) }, (_, index) => (
        <div class={styles.Filler} key={`filler-${index}`} />
      ))}
    </div>
  );
}

/** The room's answers, as a board of panels. The board is drawn whole and its answers are turned
 * over on it, so every card holds its cell from the first frame rather than arriving into a
 * grid that reflows as the room reads it. */
export function AnswerCards({ answers, revealed, ...board }: AnswerCardsProps) {
  return <BoardGrid {...board} answers={answers} upTo={revealed ?? answers.length} />;
}
