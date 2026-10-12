import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { Pop, useViewportMeasure } from '@/Design/Primitives';
import { playSound } from '../../Sounds';
import { AnswerCard } from '../AnswerCard';
import styles from './AnswerCards.module.css';

/** One answer the room is being shown, as the bank draws it. Its own shape rather than the
 * review screen's, since the bank is a design component and knows nothing about a phase. */
export interface AnswerCardsEntry {
  id: number;
  text: string;
  /** How many players wrote this answer. */
  count: number;
  /** Whether this player has already voted against it. */
  voted: boolean;
  /** Whether this is the card of a player who wrote nothing. Drawn like any other answer and not
   * votable, since there is no answer on it to vote out. */
  blank?: boolean;
}

export type AnswerCardsColumns = 1 | 2 | 3;

export interface AnswerCardsProps {
  answers: readonly AnswerCardsEntry[];
  /** Voting an answer out. Left out where the room is being shown the round rather than asked
   * about it, and the cards are then records rather than controls. */
  onReject?: (id: number) => void;
  /** How many of the answers have been turned over. The rest are not on the board yet, which is
   * the point of the round: a board the room can already read is a board nobody watched being
   * wrong about. Left out the whole board is up, which is every use but the one it exists for. */
  revealed?: number;
}

/** How many answers go across. The widest a bank of them is drawn, and a row of four short
 * panels is a strip rather than a board. */
const MaxColumns = 3;

/** The narrowest a card may be and still hold a sentence. Below this the board would rather have
 * fewer, larger cards, since the answers on them are read and not scanned. */
const MinCardWidth = 180;

/** Raised over `--Pop-Stagger`, the beat a row of characters standing close arrives on. The same
 * as the theme bank's, so answers land the way cards land. */
const SlotStagger = '40ms';

/** How many answers go across. The room's own count first, so two answers sit side by side
 * rather than as one column with a gap beside it; then the width, which may refuse it and give
 * fewer, larger cards rather than unreadable ones. */
function columnsFor(count: number, boardWidth: number): AnswerCardsColumns {
  const wanted = Math.min(MaxColumns, Math.max(1, count));
  // A board with no width yet has nothing to refuse the count, which is the first render and any
  // browser that will not measure. One column for an unmeasured board would be a board that laid
  // itself out once and never again, since the measurement is what moves it off that.
  if (boardWidth <= 0) {
    return asColumns(wanted);
  }
  return asColumns(Math.min(wanted, Math.max(1, Math.floor(boardWidth / MinCardWidth))));
}

/** A count as the union the board's classes are named from. Three cases rather than a cast. */
function asColumns(value: number): AnswerCardsColumns {
  if (value >= 3) return 3;
  if (value === 2) return 2;
  return 1;
}

/** The cells the last row is short by, drawn empty so a row of four answers on three columns
 * reads as two over one rather than with the last one hanging off the left. Counted from the
 * same column count the grid is cut for, which is why that count is decided in render. */
function fillersFor(count: number, columns: AnswerCardsColumns): number {
  return (columns - (count % columns)) % columns;
}

/** One answer's slot in the board: its cell in the grid and the card in it. A function rather
 * than more markup in the map, since the slot is where the card's shape is decided and the card
 * is a closed component that knows nothing about it. */
type SlotProps = Pick<AnswerCardsProps, 'onReject'> & {
  answer: AnswerCardsEntry;
  index: number;
  open: boolean;
};

function AnswerSlot({ answer, index, onReject, open }: SlotProps) {
  // No vote out of a blank card: there is no answer on it, so a vote would move nothing the room
  // can see and the press would read as a control that does not work.
  const reject =
    onReject === undefined || answer.blank === true ? undefined : () => onReject(answer.id);
  // The same note the round's question lands a word on, on the same kind of moment: this card is
  // up. Pitch zero rather than the card's place in the run, since a board played as a rising scale
  // would be a tune rather than a room reading what it wrote.
  useEffect(() => {
    if (open) playSound('Card', 0);
  }, [open]);
  return (
    <div class={styles.Slot}>
      {/* The arrival, keyed on whether the card has been turned over rather than on the answer, so
       * the squash plays at the moment the room gets to see this answer and not at the moment the
       * board was drawn. */}
      <Pop trigger={open ? answer.id : 'turned'} index={index} stagger={SlotStagger}>
        <AnswerCard
          text={answer.text}
          count={answer.count}
          voted={answer.voted}
          blank={answer.blank}
          turned={open}
          onReject={reject}
        />
      </Pop>
    </div>
  );
}

/** The room's answers, as a board of panels that fills the room it is given in both directions.
 * Nine answers are three by three and twelve are three by four, because the count of columns is
 * the count of answers capped at three and the rows are whatever is left over. */
export function AnswerCards({ answers, onReject, revealed }: AnswerCardsProps) {
  const board = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState<AnswerCardsColumns>(() =>
    columnsFor(answers.length, 0)
  );
  const measure = useCallback(() => {
    setColumns(columnsFor(answers.length, board.current?.clientWidth ?? 0));
  }, [answers.length]);
  useViewportMeasure(board, measure);

  const fillers = Array.from(
    { length: fillersFor(answers.length, columns) },
    (_, index) => index
  );

  // The board is drawn whole and its answers are turned over on it, so every card holds its cell
  // from the first frame rather than arriving into a grid that reflows as the room reads it.
  const upTo = revealed ?? answers.length;

  return (
    <div class={`${styles.Root} ${styles[`Columns${columns}`]}`} ref={board} role="group">
      {answers.map((answer, index) => (
        <AnswerSlot
          key={answer.id}
          answer={answer}
          index={index}
          open={index < upTo}
          onReject={onReject}
        />
      ))}
      {/* The cells the last row is short by, so a part-filled row sits in the middle of the board
       * rather than against its left edge. */}
      {fillers.map((index) => (
        <div class={styles.Filler} key={`filler-${index}`} />
      ))}
    </div>
  );
}
