import { PlayerId } from '@/Core';
import { ReviewingState } from './GameState';
import { groupAnswersWithPlayers } from './Grouping';
import { calculateRoundScores } from './Scoring';
import { GameConfig } from './GameConfig';

/** One group as the scorer sees it: who wrote it, and whether it was rejected. */
export interface ScoredGroup {
  playerIds: PlayerId[];
  isRejected: boolean;
}

/** Mark a group rejected when the host has muted it. One press is the whole of it: this used to
 * ask whether a majority of a group's own authors rejected it, which was a vote among players
 * and is not what muting is. */
export function toScoredGroups(state: ReviewingState): ScoredGroup[] {
  return groupAnswersWithPlayers(state.answers).map((group) => ({
    playerIds: group.playerIds,
    isRejected: state.groupRejections.has(group.groupId),
  }));
}

/** Points for this round, with the running totals carried forward. Returns both, so the caller
 * does not have to add the round onto the totals by hand and risk losing a player who scored
 * nothing. */
export function scoreRound(state: ReviewingState): {
  roundScores: Map<PlayerId, number>;
  cumulativeScores: Map<PlayerId, number>;
} {
  const roundScores = calculateRoundScores(toScoredGroups(state), GameConfig);
  const cumulativeScores = new Map(state.cumulativeScores);
  for (const [playerId, score] of roundScores) {
    cumulativeScores.set(playerId, (cumulativeScores.get(playerId) ?? 0) + score);
  }
  return { roundScores, cumulativeScores };
}
