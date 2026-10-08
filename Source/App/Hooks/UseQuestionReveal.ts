import { useEffect, useState } from 'preact/hooks';
import { GameConfig, revealedWordCount } from '@/Game';
import { hostTimeToLocal } from '@/Core';

/** How many words of the round's question this screen is showing. Counted off the host's own
 * moment rather than from when the message arrived, so a screen that joined the reveal late
 * catches up to the room instead of starting the question again from nothing. */
export function useQuestionReveal(
  question: string | undefined,
  questionAt: number | undefined,
  clockOffsetMs: number,
  held: boolean
): number {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (question === undefined || questionAt === undefined || held) {
      return;
    }
    // Read the clock on the way in rather than waiting out the first tick: a question already half
    // written when this mounted would otherwise start again from its first word.
    setShown(Date.now());
    const id = setInterval(() => setShown(Date.now()), GameConfig.timing.uiTickMs);
    return () => clearInterval(id);
  }, [question, questionAt, held]);

  if (question === undefined || questionAt === undefined) {
    return 0;
  }
  // A held room stops being written out rather than being written slowly: the host moves the
  // question's own moment on by the length of the hold, so words landing here anyway would land
  // behind the room and jump forward the moment it let go.
  const startedAt = hostTimeToLocal(questionAt, clockOffsetMs);
  return revealedWordCount(question, shown - startedAt);
}
