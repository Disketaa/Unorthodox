import { Stack } from '@/Design/Primitives';
import { AnswerCards, type AnswerCardsEntry } from './AnswerCards';

/** A board as the review phase draws it: only the duplicated card carrying a count, one already
 * muted, and the like counts running 0, 3 and 1 so a badge nobody pressed, one the room pressed
 * and one this player pressed are all on the same board. */
function board(count: number): AnswerCardsEntry[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    text: index === 1 ? 'the same answer twice' : `answer number ${index + 1}`,
    count: index === 1 ? 3 : 1,
    voted: index === 2,
    likes: index,
    liked: index === 1,
    own: index === 3,
    likeLabel: `${index} likes`,
  }));
}

/** The same board with the room being shown the round rather than asked about it, which is the
 * one case where the cards stop being controls. */
function record(count: number): AnswerCardsEntry[] {
  return board(count).map((answer) => ({ ...answer, voted: false }));
}

/** The same board with its controls on, said once so the six cases below stay a line each. */
function playable(count: number, revealed?: number) {
  const noop = () => {};
  return (
    <AnswerCards
      answers={board(count)}
      revealed={revealed}
      onReject={noop}
      onLike={noop}
      muteLabel="Mute answer"
    />
  );
}

export function AnswerCardsGallery() {
  return (
    <Stack gap="Lg">
      {/* Two answers side by side rather than as one column with a gap beside it. */}
      {playable(2)}
      {/* Nine answers, which is a board three by three. */}
      {playable(9)}
      {/* Twelve answers, which is the same three columns and one row deeper. */}
      {playable(12)}
      {/* Four answers, the case a grid cannot centre on its own: the row is part filled, and the
       * empty cells are what put the last card in the middle of it rather than against the edge. */}
      {playable(4)}
      {/* And the round being read back rather than answered. */}
      <AnswerCards answers={record(5)} />
      {/* The board half turned over, which is how the room sees it for the first few seconds. */}
      {playable(6, 2)}
    </Stack>
  );
}
