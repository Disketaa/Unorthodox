import { useEffect, useState } from 'preact/hooks';
import { GameConfig, type PublicScoreGroup } from '@/Game';
import type { PlayerId } from '@/Core';
import { countBoard } from './CountBoard';
import { boardOf } from '../Views/PlayerBarStandings';
import type { GameSessionView } from './UseGameSession';

/** Whether the room is flashed for the card the count is on: the enchantment reached one of its
 * writers, and the room has not turned the answer down. A struck-out answer is not paid, so the
 * shine and the note would be saying what the enchantment bought of nothing. */
export function flashesFor(
  group: PublicScoreGroup | undefined,
  affected: ReadonlySet<PlayerId>,
  rejected: ReadonlySet<number>
): boolean {
  if (group === undefined) return false;
  if (rejected.has(group.groupId)) return false;
  return group.playerIds.some((id) => affected.has(id));
}

/** The card the count is on, when the enchantment reached one of its writers: the room is
 * flashed with the shine on that card's own beat. The card's own number, so each enchanted card
 * counted is a flash of its own. */
export function useEnchantFlash(view: GameSessionView): number | undefined {
  const settling = view.publicState?.phase === 'Scores';
  const held = view.paused === true;
  // The room's own watch, so the flash and the board it belongs to are counted from the same
  // moment: a flash a tick away from the card that caused it is a flash of the wrong card.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!settling || held) return;
    const id = setInterval(() => setNow(Date.now()), GameConfig.timing.uiTickMs);
    return () => clearInterval(id);
  }, [settling, held]);
  const moment = held && view.pausedAt !== undefined ? view.pausedAt : now;
  const board = countBoard(settling, view.phaseStartedAt, moment);
  const group =
    board.payingIndex === undefined ? undefined : boardOf(view)?.groups[board.payingIndex];
  const affected = new Set(view.publicState?.affectedPlayerIds ?? []);
  if (!flashesFor(group, affected, view.rejectedGroupIds)) return undefined;
  return board.payingIndex;
}
