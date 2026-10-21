import { PlayerId, PlayerLook } from '@/Core';
import { ScoreEntry, lookFor } from '@/Screens';
import type { LeaderboardRow } from '@/Design/Components';

/** Turn raw scores into ranked rows the screens can render directly. */
export function toScoreEntries(
  scores: readonly { id: PlayerId; score: number }[],
  names: ReadonlyMap<PlayerId, string>,
  looks: ReadonlyMap<PlayerId, PlayerLook>
): ScoreEntry[] {
  return scores
    .map((entry) => {
      const look = lookFor(looks, entry.id);
      return {
        playerName: names.get(entry.id) ?? entry.id,
        character: look.character,
        color: look.color,
        score: entry.score,
      };
    })
    .sort((left, right) => right.score - left.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

/** Where the room stands, as the leaderboard draws it: the room's roster, so a player who wrote
 * nothing still stands and one the room has lost keeps their line. */
export function toLeaderboardRows(
  roster: readonly PlayerId[],
  totals: ReadonlyMap<PlayerId, number>,
  round: ReadonlyMap<PlayerId, number>,
  names: ReadonlyMap<PlayerId, string>,
  looks: ReadonlyMap<PlayerId, PlayerLook>,
  presence: ReadonlyMap<PlayerId, boolean>,
  selfId: PlayerId | null
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
        rank: 0,
      };
    })
    .sort((left, right) => right.score - left.score)
    .map((entry, index) => ({ ...entry, rank: index + 1, isSelf: entry.id === selfId }));
}
