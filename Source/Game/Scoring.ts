import { GameConfig } from './GameConfig';
import type { PlayerId } from '@/Core';

/** Points awarded to each player in a group of the given size. */
export function pointsForGroupSize(size: number, config: typeof GameConfig): number {
  if (size === 1) {
    return config.scoring.uniquePoints;
  }
  if (size === 2) {
    return config.scoring.pairPoints;
  }
  return config.scoring.commonPoints;
}

/** Round score per player. Everyone in a rejected group scores zero, whatever size that group
 * was. */
export function calculateRoundScores(
  groups: { playerIds: string[]; isRejected: boolean }[],
  config: typeof GameConfig
): Map<string, number> {
  const scores = new Map<string, number>();

  for (const group of groups) {
    let points = 0;
    if (!group.isRejected) {
      points = pointsForGroupSize(group.playerIds.length, config);
    }

    for (const playerId of group.playerIds) {
      scores.set(playerId, points);
    }
  }

  return scores;
}

/** Who the round gave nothing to, as the room is shown it: a player whose card is blank, and a
 * player whose card the host muted. Both are the round scoring them zero — a blank is nobody
 * having written, and a muted card is out of the round — and the bar of players breaks a hexagon
 * for each of them rather than making the room work it out off the board. A group three people
 * wrote is not one of them: that answer was right, it was simply not rare. */
export function zeroScorers(
  groups: readonly { groupId: number; playerIds: readonly PlayerId[]; isEmpty: boolean }[],
  muted: ReadonlySet<number>
): ReadonlySet<PlayerId> {
  const zero = new Set<PlayerId>();
  for (const group of groups) {
    if (group.isEmpty || muted.has(group.groupId)) {
      for (const playerId of group.playerIds) {
        zero.add(playerId);
      }
    }
  }
  return zero;
}
