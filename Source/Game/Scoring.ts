import { GameConfig } from './GameConfig';
import type { PlayerId } from '@/Core';

/** Everything one card is worth. `speedShare` is the share of the writing clock the answer took,
 * from 0 for the first tick to 1 for the grace period running out. */
export interface CardScore {
  /** How many players wrote this answer. One is the only size that is paid for being early. */
  groupSize: number;
  isRejected: boolean;
  /** Whether this is the card of somebody who wrote nothing, standing for a round they sat out.
   * A separate thing from being struck out: the room never had an answer to turn down here. */
  isEmpty: boolean;
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

/** What one card pays out. Four things are zero and they are zero in this order: the card of a
 * player who wrote nothing, a struck-out card, an answer nobody can be first with, and an
 * answer somebody else wrote first — a blank card reads as the first tick, which pays the most. */
export function scoreCard(
  card: CardScore,
  config: typeof GameConfig = GameConfig
): { points: number; fromSpeed: number; fromLikes: number } {
  if (card.isEmpty || card.isRejected) {
    return { points: 0, fromSpeed: 0, fromLikes: 0 };
  }
  if (card.groupSize > 1) {
    // A shared answer pays nothing at all, and pays the same nothing whatever wrote it: two
    // people and four both wrote what the room had already heard, and the size of the group is
    // not a thing to pay more of. No speed and no likes: a like is the room finding it once.
    return { points: config.scoring.duplicatePoints, fromSpeed: 0, fromLikes: 0 };
  }
  // Rounded after the multiplier, not before it: a card paying half a point twice would leave a
  // running total at twenty-two and a bit, and a standing is a whole number of points or it is
  // not one. Rounded here so the same figure is on the card, in the bar and on the final screen.
  const fromSpeed = Math.round(speedPoints(card.speedShare, config) * card.mult);
  const fromLikes = card.likes * config.scoring.likePoints;
  return { points: fromSpeed + fromLikes, fromSpeed, fromLikes };
}

/** The steps one card's score counts up through, in order, named for what they pay: the answer's
 * own worth, what the round's card made of it, what the room thought of it. A struck-out or
 * shared card is paid nothing and so has no steps to climb. */
export function scoreSteps(
  card: CardScore,
  config: typeof GameConfig = GameConfig
): {
  base: number;
  mult: number;
  likes: number;
  total: number;
} {
  const scored = scoreCard(card, config);
  if (card.isEmpty || card.isRejected || card.groupSize > 1) {
    return { base: 0, mult: 0, likes: 0, total: scored.points };
  }
  const base = Math.round(speedPoints(card.speedShare, config));
  return {
    base,
    mult: Math.round(scored.fromSpeed) - base,
    likes: scored.fromLikes,
    total: scored.points,
  };
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
