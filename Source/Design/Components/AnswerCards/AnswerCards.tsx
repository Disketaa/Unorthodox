import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { Pop, useViewportMeasure } from '@/Design/Primitives';
import { playSound } from '../../Sounds';
import { AnswerCard, type AnswerAuthor } from '../AnswerCard';
import type { PlayerId } from '@/Core';
import styles from './AnswerCards.module.css';
import { columnsFor, fillersFor, type AnswerCardsColumns } from './AnswerCardsLayout';

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
  /** When each of those writers lands, in the order they are drawn. */
  writerDelays?: readonly number[];
  /** Whether the room has been told who wrote this answer yet. Off for the first stretch of the
   * card's beat, so an answer lands on its own before the room finds out who agreed with it. */
  authorsShown?: boolean;
  /** How many of the writers have landed in the corner. The figure behind the answer counts up
   * as it rises, and a shared answer is drawn as struck out on the second face rather than on
   * the round's own decision, which the room was told about a beat before it could see it. */
  landed?: number;
  /** Whether the room is yet offered a like on this card. A badge arriving on the same frame as
   * the thing it is about is a control rather than an invitation, so it waits for the card to
   * finish and then a beat. */
  revealed?: boolean;
  /** Which of the writers is this player, so their own chip is marked the way the bar at the top
   * of the game marks it. Left out, no chip is the local player's. */
  ownPlayerId?: PlayerId | null;
}

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

/** Raised over `--Pop-Stagger`, the beat a row of characters standing close arrives on. The same
 * as the theme bank's, so answers land the way cards land. */
const SlotStagger = '40ms';

/** One answer's slot in the board: its cell in the grid and the card in it. A function rather
 * than more markup in the map, since the slot is where the card's shape is decided and the card
 * is a closed component that knows nothing about it. */
type SlotProps = Pick<AnswerCardsProps, 'onReject' | 'onLike' | 'muteLabel'> & {
  answer: AnswerCardsEntry;
  index: number;
  open: boolean;
};

/** What a card's arrival is keyed on, so the squash replays rather than playing once: the card
 * pops as it is turned over, and again as the room is told who wrote it. Never on the mute,
 * which is a recolour rather than an arrival. */
function popTrigger(answer: AnswerCardsEntry, open: boolean): string {
  if (!open) return 'turned';
  return answer.authorsShown === false ? `open-${answer.id}` : `named-${answer.id}`;
}

function AnswerSlot({ answer, index, onReject, onLike, muteLabel, open }: SlotProps) {
  const controls = slotControls(answer, onReject, onLike);
  // The same note the round's question lands a word on, on the same kind of moment: this card is
  // up. Pitch zero rather than its place in the run, which would be a tune rather than a room.
  useEffect(() => {
    if (open) playSound('Card', 0);
  }, [open]);
  // The beat the room finds out who wrote it: one note, at a random pitch, so a board of them is a
  // board rather than one note repeated. Here rather than on the card, which every pop remounts.
  const named = open && answer.authorsShown !== false && (answer.authors?.length ?? 0) > 0;
  useEffect(() => {
    if (named) playSound('Reveal');
  }, [named]);
  return (
    <div class={styles.Slot}>
      {/* The arrival, keyed on the beat rather than on the answer, so the squash plays when the room
       * gets to see this answer — and again on the beat the room is told who wrote it. */}
      <Pop trigger={popTrigger(answer, open)} index={index} stagger={SlotStagger}>
        <AnswerCard {...cardProps(answer, open, controls)} muteLabel={muteLabel} />
      </Pop>
    </div>
  );
}

/** A shared answer is off the board from the start and cannot be put back: what the room turned
 * down was the thing several of them said. It keeps the mute, the one control that is for
 * taking it back. */
function slotControls(
  answer: AnswerCardsEntry,
  onReject: ((id: number) => void) | undefined,
  onLike: ((id: number) => void) | undefined
) {
  const settled = answer.voted === true && answer.count > 1;
  return {
    settled,
    // Nor a like on a blank or a player's own answer: nothing there is theirs to have liked. Not
    // gated on the card being declined either — it is declined from the start, but the room is
    // only shown that once the card has said there was more than one of them.
    reject:
      onReject === undefined || answer.blank === true || settled
        ? undefined
        : () => onReject(answer.id),
    like:
      onLike === undefined || answer.blank === true || answer.own === true
        ? undefined
        : () => onLike(answer.id),
  };
}

function cardProps(
  answer: AnswerCardsEntry,
  open: boolean,
  controls: ReturnType<typeof slotControls>
) {
  return {
    text: answer.text,
    count: answer.count,
    voted: answer.voted,
    blank: answer.blank,
    locked: controls.settled,
    turned: open,
    authors: answer.authors,
    writerDelays: answer.writerDelays,
    own: answer.own === true,
    authorsShown: answer.authorsShown ?? open,
    landed: answer.landed ?? answer.count,
    revealed: answer.revealed ?? true,
    ownPlayerId: answer.ownPlayerId,
    onReject: controls.reject,
    likes: answer.likes,
    liked: answer.liked,
    likeLabel: answer.likeLabel,
    onLike: controls.like,
  };
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
