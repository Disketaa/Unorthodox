import { questionRevealMs } from '@/Game';
import { EnchantedArrivalMs } from '@/Design/Overlays';
import { useQuestionRemaining } from './UseQuestionRemaining';
import { enchantmentArriving } from '../Views/EnchantedNotice';
import type { GameSessionView } from './UseGameSession';

/** Whether the room is telling this player, right now, that the round's enchanted card has
 * reached them. Asked at the room's own level rather than by a screen, whose own clipped box
 * would crop a layer meant to be over the window. */
export function useEnchantedArrival(view: GameSessionView): boolean {
  const choosing = view.publicState?.phase === 'Choosing' ? view.publicState : undefined;
  const remaining = useQuestionRemaining(
    choosing?.question,
    choosing?.questionAt,
    view.clockOffsetMs,
    view.paused
  );
  if (!enchantmentArriving(view, choosing)) return false;
  // The opening of the reveal rather than all of it, so a screen that joined the question
  // half-written is not shown an arrival that has already been and gone.
  return remaining >= questionRevealMs(choosing?.question ?? '') - EnchantedArrivalMs;
}
