import type { ComponentChildren } from 'preact';
import { useSlotNotes } from './AnswerCardNotes';
import { SlotCard } from './SlotCard';
import type { AnswerCardsEntry } from './AnswerCardsEntry';
import type { AnswerCardsProps } from './AnswerCards';
import styles from './AnswerCards.module.css';

/** One answer's slot in the board: its cell in the grid and the card in it. */
type SlotProps = Pick<
  AnswerCardsProps,
  'onReject' | 'onLike' | 'muteLabel' | 'payingIndex' | 'payingElapsedMs' | 'paused' | 'run'
> & {
  answer: AnswerCardsEntry;
  index: number;
  open: boolean;
  /** Whether this card's cell is the one held above the dark, being paid. Its own prop rather
   * than one read off the board's, since what lifts a card is its place and not anything a
   * caller said about it. */
  lifted?: boolean;
};

/** The cell around a card: what lifts it above the dark is its place on the board, and what
 * settles it once the count has been through is that the count has been through it. */
function SlotCell({
  lifted,
  paidEver,
  children,
}: {
  lifted: boolean;
  paidEver: boolean;
  children: ComponentChildren;
}) {
  return (
    <div
      class={`${styles.Slot} ${lifted ? styles.Lifted : ''} ${paidEver ? styles.Settled : ''}`}
    >
      {children}
    </div>
  );
}

export function AnswerSlot({
  answer,
  index,
  onReject,
  onLike,
  muteLabel,
  open,
  payingIndex,
  payingElapsedMs,
  lifted,
  paused,
  run,
}: SlotProps) {
  const paidEver = useSlotNotes(
    answer,
    index,
    payingIndex,
    payingElapsedMs,
    lifted === true,
    open
  );
  return (
    <SlotCell lifted={lifted === true} paidEver={paidEver}>
      <SlotCard
        answer={answer}
        index={index}
        open={open}
        paidEver={paidEver}
        onReject={onReject}
        onLike={onLike}
        muteLabel={muteLabel}
        payingIndex={payingIndex}
        payingElapsedMs={payingElapsedMs}
        paused={paused}
        run={run}
      />
    </SlotCell>
  );
}
