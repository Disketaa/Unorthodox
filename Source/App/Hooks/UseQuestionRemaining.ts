import { useEffect, useState } from 'preact/hooks';
import { GameConfig, questionRevealMs } from '@/Game';
import { hostTimeToLocal } from '@/Core';

/** What is left of the round's question, in milliseconds: how long the reveal still runs before
 * the round starts. Read off the host's own moment rather than from when this screen mounted,
 * so a screen that joined late is told the same thing the room is. */
export function useQuestionRemaining(
  question: string | undefined,
  questionAt: number | undefined,
  clockOffsetMs: number,
  held: boolean
): number {
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (question === undefined || questionAt === undefined || held) {
      return;
    }
    // Read the clock on the way in rather than waiting out the first tick: a question already half
    // written when this mounted would otherwise report a full reveal's worth of time still to run.
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), GameConfig.timing.uiTickMs);
    return () => clearInterval(id);
  }, [question, questionAt, held]);

  if (question === undefined || questionAt === undefined || now === 0) {
    return 0;
  }
  // A held room is not being written out, so nothing is left to count: the words are on the screen
  // and the round waits for the host, and the reveal is measured against the same moment the words
  // themselves are measured against.
  const startedAt = hostTimeToLocal(questionAt, clockOffsetMs);
  return Math.max(0, questionRevealMs(question) - (now - startedAt));
}
