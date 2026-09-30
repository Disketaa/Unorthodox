
import { GameConfig } from './GameConfig';

/**
 * Points awarded for a group of a given size.
 * @param size Number of players in the group
 * @param config Game configuration
 * @returns Points per player in the group
 */
export function pointsForGroupSize(size: number, config: typeof GameConfig): number {
  if (size === 1) {
    return config.scoring.uniquePoints;
  }
  if (size === 2) {
    return config.scoring.pairPoints;
  }
  // size >= 3
  return config.scoring.commonPoints;
}

/**
 * Calculate scores for each player based on the groups.
 * @param groups Array of answer groups (each group has playerIds and a flag isRejected)
 * @param config Game configuration
 * @returns Map of playerId to score for the round
 */
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
    // If rejected, points remain 0.

    for (const playerId of group.playerIds) {
      scores.set(playerId, points);
    }
  }

  return scores;
}

