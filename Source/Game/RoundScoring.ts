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

/** Whether the round has declined this answer, which is the one rule the card, the bar and the
 * score all have to agree on: a card struck out that still scores is a card the room cannot
 * trust. Two ways an answer comes to be declined, and they are not the same thing. */
export function isDeclined(
  group: { groupId: number; playerIds: readonly PlayerId[] },
  muted: ReadonlyMap<number, Set<PlayerId>>
): boolean {
  return group.playerIds.length > 1 || muted.has(group.groupId);
}

/** Every group the round has declined, shared answers included, so the card and the bar are told
 * the same thing the scorer is. The ids rather than the groups, since all three want the same
 * question answered about the same set of numbers. */
export function declinedGroupIds(state: ReviewingState): Set<number> {
  const declined = new Set<number>(state.groupRejections.keys());
  for (const group of groupAnswersWithPlayers(state.answers)) {
    if (group.playerIds.length > 1) declined.add(group.groupId);
  }
  return declined;
}

/** Mark a group rejected when the host has muted it. The scorer is deliberately left alone by
 * `isDeclined`: the board shows a shared answer as declined, but a pair still scores, which is
 * the round working rather than the round breaking. */
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
