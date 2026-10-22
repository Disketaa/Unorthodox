/** The parts of a stored room that every phase carries, read back out of the stored members. Its
 * own file because the roster is read the same way by every phase, and a phase gaining a field
 * is not a phase rewriting the roster. */
import type { RoomMembers } from '@/Game';
import { type Members } from './RoomStateCodec';

/** The roster, totals, turn and pace every phase carries, read once out of the stored members.
 * The scores are the running totals here rather than the round's own, which is why they are
 * renamed on the way out. */
export function commonOf(members: Members): RoomMembers {
  const {
    scores,
    players,
    turnPlayerId,
    pace,
    themes,
    themeMode,
    themeRounds,
    affectedPlayers,
    paused,
    pausedAt,
    customThemes,
  } = members;
  return {
    players,
    cumulativeScores: scores,
    turnPlayerId,
    pace,
    themes,
    themeMode,
    customThemes,
    themeRounds,
    affectedPlayers,
    paused,
    pausedAt,
  };
}
