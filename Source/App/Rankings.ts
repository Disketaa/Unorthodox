import { PlayerId } from '@/Core';
import { ScoreEntry } from '@/Screens';

/** Turn raw scores into ranked rows the screens can render directly. */
export function toScoreEntries(
  scores: readonly { id: PlayerId; score: number }[],
  names: ReadonlyMap<PlayerId, string>,
): ScoreEntry[] {
  return scores
    .map((entry) => ({ playerName: names.get(entry.id) ?? entry.id, score: entry.score }))
    .sort((left, right) => right.score - left.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
