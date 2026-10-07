import { PlayerId, PlayerLook } from '@/Core';
import { ScoreEntry, lookFor } from '@/Screens';

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
