import { useEffect, useRef, useState } from 'preact/hooks';
import { playSound } from '../../Sounds';
import { cardLeaves } from './CardLeaves';
import type { AnswerCardsEntry } from './AnswerCardsEntry';

/** Whether the count has reached this card yet, kept as a thing that only moves forward. State
 * rather than a ref because it changes what is rendered, and the slot itself is rebuilt when
 * the phase restarts, so this starts over with it. */
function usePaidOnce(index: number, payingIndex: number | undefined): boolean {
  const [paid, setPaid] = useState(false);
  useEffect(() => {
    if (payingIndex !== undefined && payingIndex >= index) {
      setPaid(true);
    }
  }, [payingIndex, index]);
  return paid;
}

/** The note that says the count has arrived on this card, once and only on the arrival. The card
 * arriving in the room and the card being paid for are two moments and not the same sound
 * twice. Kept to the first crossing by a ref: what has sounded is a fact about the past. */
function usePaidNote(paid: boolean): void {
  const sounded = useRef(false);
  useEffect(() => {
    if (!paid || sounded.current) {
      return;
    }
    sounded.current = true;
    playSound('Card', 0);
  }, [paid]);
}

/** The note that says this card was paid nothing, on the beat the card is taken off the board.
 * Here on the slot rather than inside the card, which is the whole point: the card's pop
 * re-keys its subtree on every arrival, so a guard kept inside it forgets itself. */
function useNothingNote(answer: AnswerCardsEntry, leaves: boolean): void {
  const said = useRef(false);
  const total = answer.score?.total;
  useEffect(() => {
    if (!leaves || total !== 0 || said.current) {
      return;
    }
    said.current = true;
    playSound('Sad');
  }, [leaves, total]);
}

/** The note that says what the card paid, on the same beat the card is taken off the board —
 * once for the card, and never for one paid nothing, which has its own note above. A card is
 * paid once however many wrote it, so this is sounded by the card rather than by each seat. */
function usePaidFigure(answer: AnswerCardsEntry, leaves: boolean): void {
  const said = useRef(false);
  const total = answer.score?.total ?? 0;
  useEffect(() => {
    if (!leaves || total === 0 || said.current) {
      return;
    }
    said.current = true;
    playSound('Eat');
  }, [leaves, total]);
}

/** Everything one slot owns that makes a sound, sounded by the slot and not by the card, since
 * the card's own pop rebuilds whatever it holds underneath. Returns whether the count has been
 * through this card, which is what the slot's settled ink and the card's last arrival key on. */
export function useSlotNotes(
  answer: AnswerCardsEntry,
  index: number,
  payingIndex: number | undefined,
  payingElapsedMs: number | undefined,
  lifted: boolean,
  open: boolean
): boolean {
  // The same note the round's question lands a word on, on the same kind of moment: this card
  // is up. Pitch zero rather than its place in the run, which would be a tune rather than a
  // room.
  useEffect(() => {
    if (open) playSound('Card', 0);
  }, [open]);
  // The beat the room finds out who wrote it: one note, at a random pitch, so a board of them
  // is a board rather than one note repeated. Here rather than on the card, which the pops
  // remount on every arrival.
  const named = open && answer.authorsShown !== false && (answer.authors?.length ?? 0) > 0;
  useEffect(() => {
    if (named) playSound('Reveal');
  }, [named]);
  const paid = usePaidOnce(index, payingIndex);
  const leaves = cardLeaves(index, payingIndex, payingElapsedMs, lifted);
  usePaidNote(paid);
  useNothingNote(answer, leaves);
  usePaidFigure(answer, leaves);
  return paid;
}
