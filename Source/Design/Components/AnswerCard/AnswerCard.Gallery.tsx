import { Stack } from '@/Design/Primitives';
import { AnswerCard, type AnswerCardProps } from './AnswerCard';

/** A card with its badge and mute named, said once so the states below stay a card each. The
 * like counts run 0, 3 and 2 so a badge nobody pressed, one the room pressed and one pressed on
 * an answer this player wrote are all on the row. */
function card(over: Partial<AnswerCardProps> & Pick<AnswerCardProps, 'text'>) {
  const noop = () => {};
  return (
    <AnswerCard
      count={1}
      likes={0}
      likeLabel="0 likes"
      muteLabel="Mute answer"
      onReject={noop}
      onLike={noop}
      {...over}
    />
  );
}

export function AnswerCardGallery() {
  return (
    <Stack direction="Horizontal" gap="Md" align="Stretch">
      {card({ text: 'one player wrote this' })}
      {/* The count behind the answer is the whole of a duplicated answer. */}
      {card({
        text: 'three players wrote this',
        count: 3,
        likes: 3,
        liked: true,
        likeLabel: '3 likes',
      })}
      {/* Muted by the host: held back, struck through, and no longer answering the pointer. */}
      {card({ text: 'muted', count: 2, voted: true, likes: 2, likeLabel: '2 likes' })}
      {/* This player's own answer. The badge is still drawn with what the room thought of it and
       * only the press is taken away, which is what `onLike` left out says. */}
      {card({ text: 'you wrote this', likes: 2, likeLabel: '2 likes', onLike: undefined })}
      {/* A card the room is being shown rather than asked about. */}
      {card({ text: 'nobody may vote', onReject: undefined, onLike: undefined })}
      {/* A player who wrote nothing, which is held back and takes neither a mute nor a like. */}
      {card({ text: 'Пусто', blank: true, onReject: undefined, onLike: undefined })}
      {/* And the same card before the room has got to it, which is every card for the first
       * second of the round. */}
      {card({ text: 'not read yet', turned: false })}
    </Stack>
  );
}
