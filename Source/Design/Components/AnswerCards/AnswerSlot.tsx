import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { useSlotNotes } from './AnswerCardNotes';
import { cardLeaves } from './CardLeaves';
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

/** Whether the count has finished this card, so the card is on its way off the board. Kept as a
 * thing that only moves forward: a card that has left is left, and a board that brought it back
 * would be a card counting twice. */
function useFlownOnce(landed: boolean): boolean {
  const [flown, setFlown] = useState(false);
  useEffect(() => {
    if (landed) {
      setFlown(true);
    }
  }, [landed]);
  return flown;
}

/** The cell around a card: what lifts it above the dark is its place on the board, what settles
 * it once the count has been through is that the count has been through it, and what takes it
 * off the board is the same fact a beat later. */
function SlotCell({
  lifted,
  paidEver,
  flown,
  children,
}: {
  lifted: boolean;
  paidEver: boolean;
  flown: boolean;
  children: ComponentChildren;
}) {
  return (
    <div
      class={`${styles.Slot} ${lifted ? styles.Lifted : ''} ${paidEver ? styles.Settled : ''} ${
        flown ? styles.Fleeing : ''
      }`}
    >
      {children}
    </div>
  );
}

export function AnswerSlot(props: SlotProps) {
  const { answer, index, open, lifted } = props;
  const paidEver = useSlotNotes(
    answer,
    index,
    props.payingIndex,
    props.payingElapsedMs,
    lifted === true,
    open
  );
  const flown = useFlownOnce(
    cardLeaves(index, props.payingIndex, props.payingElapsedMs, lifted === true)
  );
  return (
    <SlotCell lifted={lifted === true} paidEver={paidEver} flown={flown}>
      <SlotCard {...props} paidEver={paidEver} />
    </SlotCell>
  );
}
