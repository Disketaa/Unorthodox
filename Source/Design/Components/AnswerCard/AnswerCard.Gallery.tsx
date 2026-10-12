import { Stack } from '@/Design/Primitives';
import { AnswerCard } from './AnswerCard';

/** The four states a card is drawn in, each in a slot of the shape the board hands it, since the
 * size of a card is decided by the cell it is in rather than by the card. */
export function AnswerCardGallery() {
  return (
    <Stack direction="Horizontal" gap="Md" align="Stretch">
      <AnswerCard text="one player wrote this" count={1} onReject={() => {}} />
      {/* The count behind the answer is the whole of a duplicated answer. */}
      <AnswerCard text="three players wrote this" count={3} onReject={() => {}} />
      {/* Voted out by this player, so it is held back and no longer answers the pointer. */}
      <AnswerCard text="voted out" count={2} voted onReject={() => {}} />
      {/* And a card the room is being shown rather than asked about. */}
      <AnswerCard text="nobody may vote" count={1} />
      {/* A player who wrote nothing, which is held back and never takes a vote. */}
      <AnswerCard text="Пусто" count={1} blank />
      {/* And the same card before the room has got to it, which is every card for the first
       * second of the round. */}
      <AnswerCard text="not read yet" count={1} turned={false} />
    </Stack>
  );
}
