import { draftCarries, draftFits, type LetterBound } from '@/Core';

/** What a draft is worth against the round's demand: nothing is asked, it is unfinished, it is
 * missing a letter the round asked for, it is too long, or it is good. The middle three are all
 * the same to a player: the answer cannot go out, so the words say so. */
export type Demand = 'None' | 'Short' | 'Needed' | 'Pending' | 'Met';

/** No enchantment demanding anything, which is a round whose theme is not enchanted. */
const NoLetters: ReadonlySet<string> = new Set();

/** What a draft is worth against the round's demand: can this go out yet, and if not, why not. */
export function demandOf(
  value: string,
  required: ReadonlySet<string> | undefined,
  bound: LetterBound
): Demand {
  const written = value.trim().length > 0;
  const wanted = required ?? NoLetters;
  if (!written) return 'None';
  if (wanted.size > 0) return draftCarries(value, wanted) ? 'Met' : 'Needed';
  if (bound === undefined) return 'None';
  if (draftFits(value, bound)) return 'Met';
  return bound.least ? 'Short' : 'Pending';
}

/** Whether a draft is one the room will not take yet. The single question the send key, the
 * words and the bar all ask, since a player reads them as one thing said three ways. */
export function unsent(demand: Demand): boolean {
  return demand === 'Short' || demand === 'Needed' || demand === 'Pending';
}

/** Whether the round asks anything of an answer at all, which an empty draft cannot satisfy:
 * nothing written is no answer, so the bar says so even though there are no words to show it
 * on. */
export function roundAsks(
  required: ReadonlySet<string> | undefined,
  bound: LetterBound
): boolean {
  return (required?.size ?? 0) > 0 || bound !== undefined;
}
