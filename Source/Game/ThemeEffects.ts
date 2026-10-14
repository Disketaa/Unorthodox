/** Who an enchanted card's multiplier reaches, once the room has settled on it. Pure and seeded,
 * so every screen works out the same seats from the same state rather than each browser picking
 * its own. */
import { PlayerId, ThemeEffectId, randomFor, shuffle } from '@/Core';

/** The seats a card's effect reaches. Alone is the seat that pressed it, Half is half the room
 * rolled, and Laggards and Leaders are the lower and upper halves of the standings. Ties break
 * by roster order, opposite ways per half, so a tied room still gets two halves. */
export function affectedPlayersFor(
  effect: ThemeEffectId,
  playerIds: readonly PlayerId[],
  scores: ReadonlyMap<PlayerId, number>,
  chooserId: PlayerId | undefined,
  seed: string
): Set<PlayerId> {
  if (effect === 'Alone') {
    return chooserId === undefined ? new Set() : new Set([chooserId]);
  }
  const half = Math.floor(playerIds.length / 2);
  if (half === 0) {
    return new Set();
  }
  if (effect === 'Half') {
    return new Set(shuffle([...playerIds], randomFor(seed)).slice(0, half));
  }
  const ranked = [...playerIds].sort((a, b) => {
    const scoreA = scores.get(a) ?? 0;
    const scoreB = scores.get(b) ?? 0;
    if (scoreA !== scoreB) {
      return effect === 'Laggards' ? scoreA - scoreB : scoreB - scoreA;
    }
    return effect === 'Laggards'
      ? playerIds.indexOf(b) - playerIds.indexOf(a)
      : playerIds.indexOf(a) - playerIds.indexOf(b);
  });
  return new Set(ranked.slice(0, half));
}
