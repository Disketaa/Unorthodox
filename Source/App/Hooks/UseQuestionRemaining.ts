import { hostTimeToLocal } from '@/Core';
import { questionRevealMs } from '@/Game';
import { useUiTick } from './UseUiTick';

/** What is left of the round's question, in milliseconds: how long the reveal still runs before
 * the round starts. Read off the host's own moment rather than from when this screen mounted,
 * so a screen that joined late is told the same thing the room is. */
export function useQuestionRemaining(
  question: string | undefined,
  questionAt: number | undefined,
  clockOffsetMs: number,
  held: boolean
): number {
  useUiTick(question !== undefined && questionAt !== undefined && !held);
  if (question === undefined || questionAt === undefined) {
    return 0;
  }
  // A held room is not being written out, so nothing is left to count: the words are on the screen
  // and the round waits for the host, and the reveal is measured against the same moment the words
  // themselves are measured against.
  const startedAt = hostTimeToLocal(questionAt, clockOffsetMs);
  return Math.max(0, questionRevealMs(question) - (Date.now() - startedAt));
}
