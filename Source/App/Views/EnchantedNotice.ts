import type { PublicChoosingState } from '@/Game';
import type { PhaseViewProps } from './LobbyView';

/** Whether the round's enchantment is this player's, and whether the question has begun being
 * written. The word opens the reveal: this is the one thing about the round the player does not
 * know yet. */
export function enchantmentArriving(
  view: PhaseViewProps['view'],
  choosing: PublicChoosingState | undefined
): boolean {
  if (choosing?.question === undefined) return false;
  return (
    view.playerId !== null &&
    (view.publicState?.affectedPlayerIds?.includes(view.playerId) ?? false)
  );
}
