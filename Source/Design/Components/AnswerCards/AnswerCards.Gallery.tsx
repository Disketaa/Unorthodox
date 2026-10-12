import { Stack } from '@/Design/Primitives';
import { AnswerCards, type AnswerCardsEntry } from './AnswerCards';

/** A board of answers as the review phase draws it: one group per line, only the duplicated one
 * carrying a count, and one of them already voted out so both states are on the same board. */
function board(count: number): AnswerCardsEntry[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    text: index === 1 ? 'the same answer twice' : `answer number ${index + 1}`,
    count: index === 1 ? 3 : 1,
    voted: index === 2,
  }));
}

/** The same board again with the room being shown the round rather than asked about it, which is
 * the one case where the cards stop being controls. */
function record(count: number): AnswerCardsEntry[] {
  return board(count).map((answer) => ({ ...answer, voted: false }));
}

export function AnswerCardsGallery() {
  return (
    <Stack gap="Lg">
      {/* Two answers side by side rather than as one column with a gap beside it. */}
      <AnswerCards answers={board(2)} onReject={() => {}} />
      {/* Nine answers, which is a board three by three. */}
      <AnswerCards answers={board(9)} onReject={() => {}} />
      {/* Twelve answers, which is the same three columns and one row deeper. */}
      <AnswerCards answers={board(12)} onReject={() => {}} />
      {/* Four answers, the case a grid cannot centre on its own: the row is part filled, and the
       * empty cells are what put the last card in the middle of it rather than against the edge. */}
      <AnswerCards answers={board(4)} onReject={() => {}} />
      {/* And the round being read back rather than answered. */}
      <AnswerCards answers={record(5)} />
      {/* The board half turned over, which is how the room sees it for the first few seconds. */}
      <AnswerCards answers={board(6)} revealed={2} onReject={() => {}} />
    </Stack>
  );
}
