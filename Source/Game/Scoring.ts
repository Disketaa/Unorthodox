
import { GameConfig } from './GameConfig';

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

/** Round score per player. Everyone in a rejected group scores zero, whatever size that group was. */
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
