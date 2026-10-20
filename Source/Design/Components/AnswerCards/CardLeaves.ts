import { flyOutDelayMs, scoreCountMs } from '../ScoreTiming';

/** Whether the count has finished this card, the room has had its beat with the figure, and the
 * card is on its way off the board: a card the count has passed is gone already, and the card
 * being counted goes once its figure has had the beat the room reads it in. */
export function cardLeaves(
  index: number,
  payingIndex: number | undefined,
  payingElapsedMs: number | undefined,
  lifted: boolean
): boolean {
  if (payingIndex === undefined || payingIndex < index) return false;
  if (payingIndex > index) return true;
  return lifted && (payingElapsedMs ?? 0) >= scoreCountMs() + flyOutDelayMs();
}
