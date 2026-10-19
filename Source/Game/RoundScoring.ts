import { PlayerId } from '@/Core';
import { BoardState } from './GameState';
import { groupAnswersWithPlayers } from './Grouping';
import { calculateRoundScores, scoreCard } from './Scoring';
import type { CardScore } from './Scoring';
import { GameConfig } from './GameConfig';

/** A board the scorer can be run over. A board mid-round has no verdicts on it yet — the host
 * has not struck anything out and nobody has liked anything — and a round counted from there
 * has to read those as nothing rather than crash on their absence. */
export type ScoreableBoard = Omit<BoardState, 'groupRejections' | 'groupLikes'> &
  Partial<Pick<BoardState, 'groupRejections' | 'groupLikes'>>;

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
export function declinedGroupIds(state: BoardState): Set<number> {
  const declined = new Set<number>(state.groupRejections.keys());
  for (const group of groupAnswersWithPlayers(state.answers)) {
    if (group.playerIds.length > 1) declined.add(group.groupId);
  }
  return declined;
}

/** Mark a group rejected when the host has muted it. The scorer is deliberately left alone by
 * `isDeclined`: the board shows a shared answer as declined, but a pair still scores, which is
 * the round working rather than the round breaking. */
export function toScoredGroups(state: BoardState): ScoredGroup[] {
  return groupAnswersWithPlayers(state.answers).map((group) => ({
    playerIds: group.playerIds,
    isRejected: state.groupRejections.has(group.groupId),
  }));
}

/** How many cards the count has to walk on this board, which is how long it will take and so how
 * long the phase drawing it has to last. Every answer written is a card, and everybody who
 * wrote nothing is one card between them — the same shape the board is drawn in. */
export function boardCardCount(state: BoardState): number {
  const written = groupAnswersWithPlayers(state.answers).length;
  const blanked = [...state.players.keys()].some((playerId) => !state.answers.has(playerId));
  return written + (blanked ? 1 : 0);
}

/** How far into the writing clock one player's answer took, as it was measured when the answer
 * reached the host. Read rather than worked out, since a share measured here would be measured
 * against the clock of whatever phase the room is in now. */
export function speedShareOf(
  state: Pick<BoardState, 'answerShares'>,
  playerId: PlayerId
): number {
  return state.answerShares?.get(playerId) ?? 0;
}

/** One card as the scorer reads it: how many wrote it, whether the host struck it out, how early
 * it was sent, how many liked it and what the round's card wears. */
export function toCardScore(
  state: ScoreableBoard,
  group: { playerIds: PlayerId[]; groupId: number; isEmpty?: boolean }
): CardScore {
  const author = group.playerIds[0];
  return {
    groupSize: group.playerIds.length,
    isRejected: state.groupRejections?.has(group.groupId) === true,
    // The card of a player who wrote nothing. Its writers sent no time, and the speed curve reads
    // a missing time as the earliest there is, so without this the round nobody played would be the
    // most valuable card on the board.
    isEmpty: group.isEmpty === true,
    speedShare: author === undefined ? 0 : speedShareOf(state, author),
    likes: state.groupLikes?.get(group.groupId)?.size ?? 0,
    mult: state.mult ?? 1,
  };
}

/** The round's cards, in the shape the scorer takes, so nothing about a card is read twice. */
export function toScoredCards(state: ScoreableBoard): {
  playerIds: PlayerId[];
  card: CardScore;
}[] {
  return groupAnswersWithPlayers(state.answers).map((group) => ({
    playerIds: group.playerIds,
    card: toCardScore(state, group),
  }));
}

/** Points for this round, with the running totals carried forward. Returns both, so the caller
 * does not have to add the round onto the totals by hand and risk losing a player who scored
 * nothing, and so the room can be shown the same running total while the round is still open. */
export function scoreRound(state: ScoreableBoard): {
  roundScores: Map<PlayerId, number>;
  cumulativeScores: Map<PlayerId, number>;
  fromSpeed: number;
  fromLikes: number;
} {
  const cards = toScoredCards(state);
  const roundScores = calculateRoundScores(cards, GameConfig);
  const cumulativeScores = new Map(state.cumulativeScores);
  let fromSpeed = 0;
  let fromLikes = 0;
  for (const { playerIds, card } of cards) {
    const share = scoreCard(card, GameConfig);
    fromSpeed += share.fromSpeed * playerIds.length;
    fromLikes += share.fromLikes * playerIds.length;
    for (const playerId of playerIds) {
      cumulativeScores.set(playerId, (cumulativeScores.get(playerId) ?? 0) + share.points);
    }
  }
  return { roundScores, cumulativeScores, fromSpeed, fromLikes };
}
