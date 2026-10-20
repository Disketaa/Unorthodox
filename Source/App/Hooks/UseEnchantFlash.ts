import { useEffect, useState } from 'preact/hooks';
import { GameConfig } from '@/Game';
import { countBoard } from './CountBoard';
import { boardOf } from '../Views/PlayerBarStandings';
import type { GameSessionView } from './UseGameSession';

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
  const reached = (group?.playerIds ?? []).some((id) => affected.has(id));
  return reached ? board.payingIndex : undefined;
}
