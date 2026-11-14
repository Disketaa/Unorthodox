import { PlayerId, PlayerLook } from '@/Core';
import { lookFor } from '@/Screens';
import type { LeaderboardRow } from '@/Design/Components';
import { Strings } from '@/Content';

/** Where the room stands, as the leaderboard draws it: the room's roster, so a player who wrote
 * nothing still stands and one the room has lost keeps their line. `gameOver` marks the top
 * standing as the room's winner, which is the only time the board names one. */
export function toLeaderboardRows(
  roster: readonly PlayerId[],
  totals: ReadonlyMap<PlayerId, number>,
  round: ReadonlyMap<PlayerId, number>,
  names: ReadonlyMap<PlayerId, string>,
  looks: ReadonlyMap<PlayerId, PlayerLook>,
  presence: ReadonlyMap<PlayerId, boolean>,
  spectators: ReadonlySet<PlayerId>,
  selfId: PlayerId | null,
  gameOver: boolean
): LeaderboardRow[] {
  return roster
    .map((id) => {
      const look = lookFor(looks, id);
      return {
        id,
        name: names.get(id) ?? id,
        character: look.character,
        color: look.color,
        score: totals.get(id) ?? 0,
        round: round.get(id) ?? 0,
        isOnline: presence.get(id) ?? true,
        isSpectator: spectators.has(id),
        spectatorText: spectators.has(id) ? Strings.scores.spectating : undefined,
        rank: 0,
      };
    })
    .sort((left, right) => {
      if (left.isSpectator !== right.isSpectator) return left.isSpectator ? 1 : -1;
      return right.score - left.score;
    })
    .map((entry, index, entries) => ({
      ...entry,
      rank: entry.isSpectator ? 0 : index + 1,
      startsSpectators:
        entry.isSpectator && (index === 0 || entries[index - 1]?.isSpectator !== true),
      isWinner: gameOver && index === 0 && !entry.isSpectator && entry.score > 0,
      isSelf: entry.id === selfId,
    }));
}
