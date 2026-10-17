import { GameConfig } from './GameConfig';
import type { PlayerId } from '@/Core';

/** Everything one card is worth. `speedShare` is the share of the writing clock the answer took,
 * from 0 for the first tick to 1 for the grace period running out. */
export interface CardScore {
  /** How many players wrote this answer. One is the only size that is paid for being early. */
  groupSize: number;
  isRejected: boolean;
  speedShare: number;
  /** How many of the other players liked it, the author excluded by the time it gets here. */
  likes: number;
  /** What the round's card wears, 1 on a plain round. */
  mult: number;
}

/** What an answer sent `speedShare` of the way through the clock is worth, before the card's
 * multiplier. A curve rather than shelves, since shelves gather players onto three numbers and
 * three numbers are three chances to finish level. */
export function speedPoints(
  speedShare: number,
  config: typeof GameConfig = GameConfig
): number {
  const spent = Math.min(1, Math.max(0, speedShare));
  return Math.round(
    config.scoring.speedMaxPoints * Math.pow(1 - spent, config.scoring.speedExponent)
  );
}

/** What one card pays out. Three things are zero and they are zero in this order: a struck-out
 * card, an answer nobody can be first with, and an answer somebody else wrote first. */
export function scoreCard(
  card: CardScore,
  config: typeof GameConfig = GameConfig
): { points: number; fromSpeed: number; fromLikes: number } {
  if (card.isRejected) {
    return { points: 0, fromSpeed: 0, fromLikes: 0 };
  }
  if (card.groupSize > 1) {
    // A shared answer pays its flat rate and nothing else: no speed, since the room already had
    // the idea, and no likes, since a like is the room finding something once. Three or more
    // wrote the same thing and there is nothing left to pay anybody for it.
    const points =
      card.groupSize === 2
        ? config.scoring.pairPoints * card.mult
        : config.scoring.commonPoints;
    return { points, fromSpeed: 0, fromLikes: 0 };
  }
  const fromSpeed = speedPoints(card.speedShare, config) * card.mult;
  const fromLikes = card.likes * config.scoring.likePoints;
  return { points: fromSpeed + fromLikes, fromSpeed, fromLikes };
}

/** Round score per player. Everyone in a card pays what that card pays, and a card nobody wrote
 * is not a card, so a player who never answered is in no map at all. */
export function calculateRoundScores(
  cards: readonly { playerIds: PlayerId[]; card: CardScore }[],
  config: typeof GameConfig = GameConfig
): Map<PlayerId, number> {
  const scores = new Map<PlayerId, number>();
  for (const { playerIds, card } of cards) {
    const { points } = scoreCard(card, config);
    for (const playerId of playerIds) {
      scores.set(playerId, (scores.get(playerId) ?? 0) + points);
    }
  }
  return scores;
}

/** Who the round gave nothing to, as the room is shown it: a player whose card is blank, one the
 * host muted, and one whose answer three or more wrote. Read off the same function the round
 * scores with, so a broken seat and a running total cannot drift. */
export function zeroScorers(
  groups: readonly { groupId: number; playerIds: readonly PlayerId[]; isEmpty: boolean }[],
  muted: ReadonlySet<number>
): ReadonlySet<PlayerId> {
  const zero = new Set<PlayerId>();
  for (const group of groups) {
    if (group.isEmpty || muted.has(group.groupId) || group.playerIds.length > 1) {
      for (const playerId of group.playerIds) {
        zero.add(playerId);
      }
    }
  }
  return zero;
}
