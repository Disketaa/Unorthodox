import { Pop } from '@/Design/Primitives';
import { AnswerCard } from '../AnswerCard';
import type { AnswerCardsEntry } from './AnswerCardsEntry';

/** Raised over `--Pop-Stagger`, the beat a row of characters standing close arrives on. The same
 * as the theme bank's, so answers land the way cards land. */
const SlotStagger = '40ms';

/** What a card's arrival is keyed on, so the squash replays rather than playing once: as it is
 * turned over, again as the room is told who wrote it, once more when the count reaches it —
 * always what the card was given, never a moment that hands its turn back and then takes it. */
function popTrigger(answer: AnswerCardsEntry, open: boolean, paidEver: boolean): string {
  if (!open) return 'turned';
  const arrival = answer.authorsShown === false ? `open-${answer.id}` : `named-${answer.id}`;
  return paidEver ? `${arrival}-paid` : arrival;
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
    // Nor a like on a blank or a player's own answer: nothing there is theirs to have liked.
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

/** Where this card stands in the count, read off the one number the walk moves with. A card past
 * the one being paid is not reached either: reading only "is there a card being paid" would
 * leave every card after it with a figure, and a board counted all at once. */
function walkState(index: number, payingIndex: number | undefined) {
  const counting = payingIndex !== undefined && payingIndex >= 0;
  return {
    counting,
    paying: counting && index === payingIndex,
    paid: counting && index < payingIndex,
  };
}

function cardProps(slot: SlotCardProps, controls: ReturnType<typeof slotControls>) {
  const { answer, index, open, payingIndex, payingElapsedMs, paused, run } = slot;
  const { counting, paying, paid } = walkState(index, payingIndex);
  const waiting = !paying && !paid;
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
    // The figure goes on only once the count has reached this card, so the board is paid one
    // card at a time from one end rather than every figure appearing at once.
    score: !waiting && answer.score !== undefined ? answer.score : undefined,
    // The count walking the board at all, not this card's place in it: the like badge wears the
    // card's own colour on every card once the room has stopped voting, so a card the count has
    // not reached is not left wearing the reader's accent on top of its writer's.
    counting,
    paying,
    paid,
    enchanted: answer.enchanted === true,
    paused,
    run,
    // The card being paid counts, and is handed the board's own elapsed time rather than
    // measuring one here: the moment it would be measured against is the host's clock, which
    // stands still while the room is held. A finished count is left with no elapsed at all.
    elapsedMs: paying ? payingElapsedMs : undefined,
  };
}

interface SlotCardProps {
  answer: AnswerCardsEntry;
  index: number;
  open: boolean;
  paidEver: boolean;
  onReject?: (id: number) => void;
  onLike?: (id: number) => void;
  muteLabel?: string;
  payingIndex?: number;
  payingElapsedMs?: number;
  paused?: boolean;
  run?: number;
}

/** The card in its cell. The count's own handovers are deliberately not keyed in here: `Pop`
 * keys its own element, so a key that moved on a handover would rebuild the card, which
 * restarts the count that asked for the pop, which asks for the pop again. */
export function SlotCard(slot: SlotCardProps) {
  const controls = slotControls(slot.answer, slot.onReject, slot.onLike);
  return (
    <Pop
      trigger={popTrigger(slot.answer, slot.open, slot.paidEver)}
      index={slot.index}
      stagger={SlotStagger}
    >
      <AnswerCard {...cardProps(slot, controls)} muteLabel={slot.muteLabel} />
    </Pop>
  );
}
