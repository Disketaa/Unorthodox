import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { Pop, useViewportMeasure } from '@/Design/Primitives';
import { playSound } from '../../Sounds';
import { AnswerCard, type AnswerAuthor } from '../AnswerCard';
import type { PlayerId } from '@/Core';
import { createLogger } from '@/Core';
import styles from './AnswerCards.module.css';

const log = createLogger('AnswerCards');

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
  /** How many liked this answer, as the room counted it. Drawn on every card including a blank,
   * since a player who sat a round out is still shown what the room thought of their seat. */
  likes?: number;
  /** Whether this player is one of the people who liked it. */
  liked?: boolean;
  /** Whether this player wrote it, and so may not like their own answer. The badge is drawn
   * either way: they are shown what the room thought of it, and only the press is taken away. */
  own?: boolean;
  /** What this card's like badge says out loud, already in the room's language. Per card rather
   * than per board because it quotes the count, and the count differs from card to card. */
  likeLabel: string;
  /** Who wrote this answer, drawn as faces in the card's corner once the room has had a moment
   * with the sentence. */
  authors?: readonly AnswerAuthor[];
  /** Whether the room has been told who wrote this answer yet. Off for the first stretch of the
   * card's beat, so an answer lands on its own before the room finds out who agreed with it. */
  authorsShown?: boolean;
  /** How many of the writers have landed in the corner. The figure behind the answer counts up as
   * it rises, and a shared answer is drawn as struck out on the second face rather than on the
   * round's own decision, which the room was told about a beat before it could see it. */
  landed?: number;
  /** Whether the room is yet offered a like on this card. Off until the card has said everything
   * it has to say and a beat has passed, since a like badge arriving on the same frame as the
   * thing it is about is a control rather than an invitation. Left out, which is every screen but
   * the round's own: a board being shown after the fact has nothing left to offer. */
  revealed?: boolean;
  /** Which of the writers is this player, so their own chip is marked the way the bar at the top
   * of the game marks it. Left out, no chip is the local player's. */
  ownPlayerId?: PlayerId | null;
}

export type AnswerCardsColumns = 1 | 2 | 3;

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
type SlotProps = Pick<AnswerCardsProps, 'onReject' | 'onLike' | 'muteLabel'> & {
  answer: AnswerCardsEntry;
  index: number;
  open: boolean;
};

/** What a card's arrival is keyed on, so the squash replays rather than playing once: the card
 * pops as it is turned over, and again as the room is told who wrote it. Not on the mute: the
 * mute is a recolour, and a squash on every card a host sweeps would drown the beat the room is
 * watching. It also means the corner's badge wave is not replayed when the card is muted, which
 * is the wave the room is actually watching. A card whose writers are named the moment it is up
 * has only the one beat, and pops once. */
function popTrigger(answer: AnswerCardsEntry, open: boolean): string {
  if (!open) return 'turned';
  return answer.authorsShown === false ? `open-${answer.id}` : `named-${answer.id}`;
}

function AnswerSlot({ answer, index, onReject, onLike, muteLabel, open }: SlotProps) {
  // A shared answer is off the board from the start and cannot be put back, whatever the card is
  // drawn as at this moment: what the room turned down was the thing several of them said, and
  // undoing that is not one press by one host. A single writer's answer is still only theirs, and
  // the host may still change their mind about it. The card decides when to draw itself that way,
  // since it is the only thing that knows how many of its writers have landed.
  const settled = answer.voted === true && answer.count > 1;
  // The mute is the one control a muted card still keeps, since taking it back is what it is for.
  // It is why this is not gated on the card being answered: a card that is muted is by definition
  // not answered, and gating on that would leave every mute with no way back at all.
  const reject =
    onReject === undefined || answer.blank === true || settled
      ? undefined
      : () => onReject(answer.id);
  // Nor a like on a blank, or on a player's own answer: there is no answer on the card that is
  // theirs to have liked. The count is drawn either way, the room being shown the same figure on
  // every card whether or not that card is one anybody may press.
  //
  // Deliberately not gated on the card being declined. A shared answer is declined from the start,
  // but the room is not shown that until it has been told there was more than one of them, and the
  // card is the only thing that knows when that is: it counts its own writers as they land. A board
  // that took the like away at the same moment the round decided, rather than the moment the room
  // found out, would take it away from a card nobody has been told is out of the round.
  //
  // Offered to the host as well, which is the correction for having once withheld it: the host
  // presses the card itself to mute, but they are still a player in the room and they liked that
  // answer like anybody else. They get it in the corner, where everybody gets it, rather than over
  // the card, which is already the mute.
  const like =
    onLike === undefined || answer.blank === true || answer.own === true
      ? undefined
      : () => onLike(answer.id);
  // Temporary: what each card decided, and what it was given to decide with, so a card drawn the
  // wrong way can be told apart from one that was never offered the control in the first place.
  // Keyed on the decisions rather than on the callbacks, which are new closures every render and
  // would print the same board four times a second.
  const canMute = reject !== undefined;
  const canLike = like !== undefined;
  const host = onReject !== undefined;
  useEffect(() => {
    log(
      'info',
      `card=${answer.id} count=${answer.count} voted=${answer.voted} locked=${settled} ` +
        `host=${host} mute=${canMute} like=${canLike} ` +
        `own=${answer.own === true} blank=${answer.blank === true}`
    );
  }, [
    answer.id,
    answer.count,
    answer.voted,
    answer.own,
    answer.blank,
    settled,
    host,
    canMute,
    canLike,
  ]);
  // The same note the round's question lands a word on, on the same kind of moment: this card is
  // up. Pitch zero rather than the card's place in the run, since a board played as a rising scale
  // would be a tune rather than a room reading what it wrote.
  useEffect(() => {
    if (open) playSound('Card', 0);
  }, [open]);
  // The beat the room finds out who wrote it and the card takes their colour: one note, at a random
  // pitch, so a board of them is a board rather than one note repeated. Off the writers rather than
  // off the flag, since a card with nobody named on it has nothing to reveal. Lives here rather
  // than on the card because the card is remounted by every pop, and a remount is not a reveal.
  const named = open && answer.authorsShown !== false && (answer.authors?.length ?? 0) > 0;
  useEffect(() => {
    if (named) playSound('Reveal');
  }, [named]);
  return (
    <div class={styles.Slot}>
      {/* The arrival, keyed on the beat rather than on the answer, so the squash plays at the
       * moment the room gets to see this answer and not at the moment the board was drawn — and
       * plays again on the beat the room is told who wrote it. */}
      <Pop trigger={popTrigger(answer, open)} index={index} stagger={SlotStagger}>
        <AnswerCard
          text={answer.text}
          count={answer.count}
          voted={answer.voted}
          blank={answer.blank}
          locked={settled}
          turned={open}
          authors={answer.authors}
          own={answer.own === true}
          authorsShown={answer.authorsShown ?? open}
          landed={answer.landed ?? answer.count}
          revealed={answer.revealed ?? true}
          ownPlayerId={answer.ownPlayerId}
          onReject={reject}
          likes={answer.likes}
          liked={answer.liked}
          likeLabel={answer.likeLabel}
          muteLabel={muteLabel}
          onLike={like}
        />
      </Pop>
    </div>
  );
}

/** The room's answers, as a board of panels that fills the room it is given in both directions.
 * Nine answers are three by three and twelve are three by four, because the count of columns is
 * the count of answers capped at three and the rows are whatever is left over. */
export function AnswerCards({
  answers,
  onReject,
  onLike,
  muteLabel,
  revealed,
}: AnswerCardsProps) {
  const board = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState<AnswerCardsColumns>(() =>
    columnsFor(answers.length, 0)
  );
  const measure = useCallback(() => {
    setColumns(columnsFor(answers.length, board.current?.clientWidth ?? 0));
  }, [answers.length]);
  useViewportMeasure(board, measure);

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
          onLike={onLike}
          muteLabel={muteLabel}
        />
      ))}
      {/* The cells the last row is short by, so a part-filled row sits in the middle of the board
       * rather than against its left edge. */}
      {Array.from({ length: fillersFor(answers.length, columns) }, (_, index) => (
        <div class={styles.Filler} key={`filler-${index}`} />
      ))}
    </div>
  );
}
